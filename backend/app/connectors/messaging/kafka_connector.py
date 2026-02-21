import json
import time
import requests
import struct
import io

try:
    from kafka import KafkaConsumer, KafkaProducer
    import fastavro
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaConsumer = None
    KafkaProducer = None
    fastavro = None

class SimpleSchemaRegistryClient:
    """Minimal Schema Registry Client to fetch/register schemas."""
    def __init__(self, url, auth=None):
        self.url = url.rstrip('/')
        self.auth = auth # (user, pass) or None
        self.schema_cache = {} # id -> schema
        self.subject_cache = {} # subject -> (id, schema)

    def get_schema(self, schema_id):
        if schema_id in self.schema_cache:
            return self.schema_cache[schema_id]
        
        resp = requests.get(f"{self.url}/schemas/ids/{schema_id}", auth=self.auth)
        resp.raise_for_status()
        schema_str = resp.json()['schema']
        schema = fastavro.parse_schema(json.loads(schema_str))
        self.schema_cache[schema_id] = schema
        return schema

    def get_latest_schema(self, subject):
        if subject in self.subject_cache:
             return self.subject_cache[subject]
             
        resp = requests.get(f"{self.url}/subjects/{subject}/versions/latest", auth=self.auth)
        resp.raise_for_status()
        data = resp.json()
        schema_id = data['id']
        schema_str = data['schema']
        schema = fastavro.parse_schema(json.loads(schema_str))
        
        self.schema_cache[schema_id] = schema
        self.subject_cache[subject] = (schema_id, schema)
        return schema_id, schema

    def register_schema(self, subject, schema_dict):
        # Check cache first if we want strict caching, but for register we usually ping
        resp = requests.post(
            f"{self.url}/subjects/{subject}/versions", 
            auth=self.auth,
            headers={'Content-Type': 'application/vnd.schemaregistry.v1+json'},
            json={'schema': json.dumps(schema_dict)}
        )
        resp.raise_for_status()
        schema_id = resp.json()['id']
        self.schema_cache[schema_id] = fastavro.parse_schema(schema_dict)
        return schema_id

class KafkaConnector:
    """Connector for reading from and writing to Kafka with advanced config and Schema Registry support."""
    
    def _get_common_config(self, config):
        """Extracts common Kafka configs (bootstrap, security)."""
        params = {
            'bootstrap_servers': config.get('bootstrapServers', 'localhost:9092').split(','),
            'security_protocol': config.get('securityProtocol', 'PLAINTEXT'),
        }
        
        # SASL Configs
        if params['security_protocol'].startwith('SASL'):
            params['sasl_mechanism'] = config.get('saslMechanism', 'PLAIN')
            username = config.get('saslUsername')
            password = config.get('saslPassword')
            if username and password:
                params['sasl_plain_username'] = username
                params['sasl_plain_password'] = password
        
        # Extra props (parse key=value lines)
        extra = config.get('extraProps', '')
        if extra:
            for line in extra.split('\n'):
                if '=' in line:
                    k, v = line.split('=', 1)
                    params[k.strip()] = v.strip()
                    
        return params

    def _decode_avro(self, payload, registry):
        """Decodes Confluent Wire Format (Magic Byte 0 + 4-byte ID + Avro Data)."""
        if len(payload) < 5:
            return None # Not a valid schema registry payload
        
        magic, schema_id = struct.unpack('>bI', payload[:5])
        if magic != 0:
            return None # Not confluent format
            
        schema = registry.get_schema(schema_id)
        return fastavro.schemaless_reader(io.BytesIO(payload[5:]), schema)

    def read(self, config):
        """Read data from Kafka topic."""
        params = self._get_common_config(config)
        topic = config.get('topic')
        if not topic: raise Exception('Kafka topic is required')
        
        # Consumer Params
        params.update({
            'group_id': config.get('groupId'),
            'auto_offset_reset': config.get('autoOffsetReset', 'earliest'),
            'enable_auto_commit': True,
            'consumer_timeout_ms': int(config.get('timeoutMs', 1000)),
            'max_poll_records': int(config.get('maxMessages', 1000)), # used loosely as batch limit here
        })
        
        # Advanced overrides
        if config.get('sessionTimeoutMs'): params['session_timeout_ms'] = int(config.get('sessionTimeoutMs'))
        if config.get('heartbeatIntervalMs'): params['heartbeat_interval_ms'] = int(config.get('heartbeatIntervalMs'))
        
        # Schema Registry Init
        registry = None
        use_sr = config.get('useSchemaRegistry', False)
        if use_sr:
            sr_url = config.get('schemaRegistryUrl')
            sr_auth = None
            if config.get('schemaRegistryUser'):
                sr_auth = (config.get('schemaRegistryUser'), config.get('schemaRegistryPass'))
            registry = SimpleSchemaRegistryClient(sr_url, auth=sr_auth)

        # Initialize Consumer
        # Note: We configure value_deserializer based on mode
        consumer = KafkaConsumer(topic, **params)
        
        data = []
        count = 0
        limit = int(config.get('maxMessages', 1000))
        
        try:
            for message in consumer:
                val = None
                try:
                    if use_sr and message.value:
                        # Try decoding Avro (Confluent format)
                        val = self._decode_avro(message.value, registry)
                        # Fallback if not avro format?
                        if val is None:
                            val = message.value.decode('utf-8')
                    else:
                        # Default JSON/String decoding
                        decoded = message.value.decode('utf-8')
                        try: val = json.loads(decoded)
                        except: val = {'value': decoded}
                    
                    if val is not None:
                        # Flatten or dict check
                        if not isinstance(val, dict): val = {'value': val}
                        data.append(val)
                        
                except Exception as e:
                    # Log error per row?
                    print(f"Error decoding message: {e}")
                    pass
                
                count += 1
                if count >= limit:
                    break
        finally:
            consumer.close()
            
        return data

    def write(self, data, config):
        """Write data to Kafka topic."""
        params = self._get_common_config(config)
        topic = config.get('topic')
        if not topic: raise Exception('Kafka topic is required')
        
        # Producer Params
        params.update({
            'acks': config.get('acks', 'all'),
            'retries': int(config.get('retries', 0) if config.get('retries') else 2147483647),
            'batch_size': int(config.get('batchSize', 16384)),
            'linger_ms': int(config.get('lingerMs', 0)),
            'compression_type': config.get('compressionType') if config.get('compressionType') != 'none' else None
        })
        
        # Convert numeric acks if possible (0, 1) or keep 'all'
        if params['acks'] in ['0', '1']: params['acks'] = int(params['acks'])

        # Schema Registry Init
        registry = None
        use_sr = config.get('useSchemaRegistry', False)
        schema_id = None
        if use_sr:
            sr_url = config.get('schemaRegistryUrl')
            sr_auth = None
            if config.get('schemaRegistryUser'):
                sr_auth = (config.get('schemaRegistryUser'), config.get('schemaRegistryPass'))
            registry = SimpleSchemaRegistryClient(sr_url, auth=sr_auth)
            
            # Fetch or Register Schema
            # For simplicity, we assume we need to register schema based on first row or use latest
            # Strategy: if 'valueSubject' is set, try getting latest. If not, try inferring from data[0]?
            # Usually users want to use latest registered schema or register a new one.
            subject = config.get('valueSubject', f"{topic}-value")
            
            # For writing, we need a schema. 
            # 1. Try get latest
            try:
                schema_id, schema = registry.get_latest_schema(subject)
            except:
                # 2. If 404, try inferring from data (complex) or require user to have registered it.
                # For this implementation, we will assume schema exists or fail if we can't infer.
                # Let's try to infer from first record using fastavro? (No, fastavro doesn't infer easily).
                # We will log warning and fail if no schema found.
                print(f"Schema not found for subject {subject}, and inference not implemented.")
                return False

        producer = KafkaProducer(**params)
        
        if not data: return False
            
        for row in data:
            key = None # We don't support keys in this simple writer yet
            
            if use_sr and schema_id:
                # Encode Avro (Magic Byte + ID + Data)
                out = io.BytesIO()
                out.write(struct.pack('>bI', 0, schema_id))
                fastavro.schemaless_writer(out, schema, row)
                val_bytes = out.getvalue()
                producer.send(topic, value=val_bytes, key=key)
            else:
                # JSON
                producer.send(topic, value=json.dumps(row).encode('utf-8'), key=key)
            
        producer.flush()
        producer.close()
                
        return True
