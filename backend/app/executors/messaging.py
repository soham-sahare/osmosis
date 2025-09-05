from .base import BaseExecutor
from app.connectors.messaging.kafka_connector import KafkaConnector

class KafkaInputExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        connector = KafkaConnector()
        return connector.read(config)

class KafkaOutputExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data:
            return []
        connector = KafkaConnector()
        connector.write(input_data, config)
        return input_data # Pass through
