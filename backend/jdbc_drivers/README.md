# JDBC Drivers Directory

Place your JDBC driver JAR files in this directory.

## Supported Drivers

### Impala
- Download: https://www.cloudera.com/downloads/connectors/impala/jdbc.html
- File: `ImpalaJDBC42.jar`

### Oracle
- Download: https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html
- File: `ojdbc8.jar` or `ojdbc11.jar`

### Custom JDBC Drivers
- Any JDBC-compatible driver JAR can be placed here
- Reference the filename in your database configuration

## Usage

In Database Reader configuration:
- **JDBC Driver Class**: e.g., `com.cloudera.impala.jdbc.Driver`
- **JDBC URL**: e.g., `jdbc:impala://host:21050/default`
- **JDBC JAR Path**: e.g., `ImpalaJDBC42.jar` (just the filename)
