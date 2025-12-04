# MCP SQL Server

A Model Context Protocol (MCP) server for querying PostgreSQL and MySQL databases.

## Features

- Connect to PostgreSQL and MySQL databases
- Execute SQL queries
- List database tables
- Describe table schemas
- Parameterized query support
- Connection pooling for better performance

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Running the Server

The server runs on stdio and communicates via the MCP protocol:

```bash
npm start
```

### Available Tools

#### 1. `connect_database`
Connect to a PostgreSQL or MySQL database. Parameters can be provided directly, loaded from environment variables, or a combination of both. If environment variables are set, the server will auto-connect on startup.

**Parameters (all optional if using environment variables):**
- `type` (string, optional): Database type - "postgresql" or "mysql"
- `host` (string, optional): Database host
- `port` (number, optional): Database port
- `database` (string, optional): Database name
- `user` (string, optional): Database user
- `password` (string, optional): Database password
- `ssl` (boolean, optional): Use SSL connection (default: false)

**Examples:**

Using parameters:
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres",
  "password": "password"
}
```

Using environment variables (call without parameters):
```json
{}
```

Mixing parameters with environment variables:
```json
{
  "type": "postgresql",
  "host": "custom-host"
}
```

#### 2. `execute_query`
Execute a SQL query on the connected database.

**Parameters:**
- `query` (string, required): SQL query to execute
- `params` (array, optional): Query parameters for parameterized queries

**Example:**
```json
{
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [123]
}
```

#### 3. `list_tables`
List all tables in the connected database.

**Parameters:** None

#### 4. `describe_table`
Get schema information for a specific table.

**Parameters:**
- `tableName` (string, required): Name of the table to describe

**Example:**
```json
{
  "tableName": "users"
}
```

#### 5. `disconnect_database`
Disconnect from the current database.

**Parameters:** None

## Configuration

### Environment Variables

You can configure database connection using environment variables. Create a `.env` file in the project root or set environment variables:

#### Option 1: Generic Environment Variables (works for both PostgreSQL and MySQL)
```bash
DB_TYPE=postgresql          # or "mysql"
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mydb
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false               # optional, set to "true" for SSL
```

#### Option 2: PostgreSQL-Specific Environment Variables
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_SSL=false         # optional
```

#### Option 3: MySQL-Specific Environment Variables
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=mydb
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_SSL=false            # optional
```

**Note:** If environment variables are set, the server will automatically connect on startup. You can also call `connect_database` without parameters to use environment variables, or provide partial parameters that will be merged with environment variables.

### MCP Client Configuration

Add this to your MCP client configuration (e.g., in Cursor or other MCP-compatible tools):

```json
{
  "mcpServers": {
    "sql": {
      "command": "node",
      "args": ["/path-to-source/postgres-mysql-mcp-server/index.js"],
      "cwd": "/path-to-source/postgres-mysql-mcp-server",
      "env": {
        "DB_TYPE": "postgresql",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_DATABASE": "mydb",
        "DB_USER": "postgres",
        "DB_PASSWORD": "password"
      }
    }
  }
}
```

**Important:** Always include `"cwd"` when using the `node` command directly, so Node can find the `node_modules` directory.

Or if using npm script:
```json
{
  "mcpServers": {
    "sql": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path-to-source/postgres-mysql-mcp-server",
      "env": {
        "DB_TYPE": "postgresql",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_DATABASE": "mydb",
        "DB_USER": "postgres",
        "DB_PASSWORD": "password"
      }
    }
  }
}
```

## Development

The project uses plain JavaScript (ES modules), so no build step is required. Just edit `index.js` and run `npm start`.

## Security Notes

- Never commit database credentials to version control
- Use environment variables or secure credential management
- The server supports SSL connections for secure database access
- Always validate and sanitize SQL queries in production environments

## Requirements

- Node.js 18+ 
- PostgreSQL or MySQL database access

## License

MIT

