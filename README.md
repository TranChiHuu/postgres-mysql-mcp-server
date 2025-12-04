# MCP SQL Server

A Model Context Protocol (MCP) server for querying PostgreSQL and MySQL databases.

## What is MCP and Why Use It?

**Model Context Protocol (MCP)** is a standardized protocol that enables AI assistants in code editors like [Cursor](https://cursor.sh/), [Windsurf](https://codeium.com/windsurf), and other AI-powered development tools to securely interact with external systems and data sources.

This MCP server bridges the gap between your AI coding assistant and your databases, allowing the AI to:

- **Understand your database schema** - The AI can explore tables, columns, and relationships
- **Write accurate SQL queries** - Generate queries based on your actual database structure
- **Debug database issues** - Query data to understand problems and verify fixes
- **Generate database-aware code** - Create application code that matches your database schema
- **Answer questions about your data** - Query the database to provide accurate information

### Perfect for AI-Powered Editors

When integrated with AI editors like **Cursor** or **Windsurf**, this MCP server transforms your AI assistant into a database-aware coding companion:

**Example Use Cases:**

1. **Schema-Aware Code Generation**
   - *You:* "Create a user registration API endpoint"
   - *AI:* Automatically queries your database schema, understands the `users` table structure, and generates code that matches your exact column names and types

2. **Intelligent Query Writing**
   - *You:* "Show me all active users from the last 30 days"
   - *AI:* Connects to your database, checks the schema, and writes a correct SQL query using your actual table and column names

3. **Database Debugging**
   - *You:* "Why is my user login failing?"
   - *AI:* Queries your database to check user records, verify table structures, and identify potential issues

4. **Data-Driven Development**
   - *You:* "Create a dashboard showing user statistics"
   - *AI:* Explores your database schema, understands relationships, and generates accurate queries and code

5. **Migration and Refactoring**
   - *You:* "Refactor this code to use the new database schema"
   - *AI:* Compares your code with the actual database schema and suggests accurate changes

### How It Works

1. **Configure** the MCP server in your AI editor (Cursor, Windsurf, etc.)
2. **Connect** to your PostgreSQL or MySQL database
3. **Ask** your AI assistant questions or request code generation
4. **AI uses** the MCP server to query your database schema and data
5. **Get** accurate, database-aware responses and code

The AI assistant can now "see" your database structure and data, making it much more helpful and accurate in generating database-related code.

## Features

- Connect to PostgreSQL and MySQL databases
- Execute SQL queries
- List database tables
- Describe table schemas
- Parameterized query support
- Connection pooling for better performance
- Secure credential management via environment variables
- Auto-connect on startup when environment variables are set

## Installation

### Option 1: Install via npm (Recommended)

Install globally to use with npx:
```bash
npm install -g postgres-mysql-mcp-server
```

Or install locally in your project:
```bash
npm install postgres-mysql-mcp-server
```

### Option 2: Use with npx (No installation required)

You can run the server directly with npx without installing:
```bash
npx postgres-mysql-mcp-server
```

### Option 3: Development Installation

For local development:
```bash
git clone https://github.com/TranChiHuu/postgres-mysql-mcp-server.git
cd postgres-mysql-mcp-server
npm install
```

## Usage

### Running the Server

The server runs on stdio and communicates via the MCP protocol.

**Using npx (recommended for most users):**
```bash
npx postgres-mysql-mcp-server
```

**Using globally installed package:**
```bash
postgres-mysql-mcp-server
```

**For local development:**
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

This MCP server integrates seamlessly with AI-powered code editors. Add it to your MCP client configuration to enable database-aware AI assistance.

#### Supported Editors

- **[Cursor](https://cursor.sh/)** - AI-powered code editor
- **[Windsurf](https://codeium.com/windsurf)** - AI-first IDE
- Any editor that supports the Model Context Protocol

#### Configuration Steps

**For Cursor:**
1. Open Cursor Settings
2. Navigate to Features → Model Context Protocol
3. Add the server configuration below

**For Windsurf:**
1. Open Settings
2. Navigate to MCP Servers
3. Add the server configuration below

**For other MCP-compatible editors:**
Add the configuration to your MCP settings file (typically `~/.config/mcp/settings.json` or editor-specific location)

#### Configuration Options

#### Option 1: Using npx (Recommended - No installation required)

```json
{
  "mcpServers": {
    "sql": {
      "command": "npx",
      "args": ["-y", "postgres-mysql-mcp-server"],
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

The `-y` flag automatically answers "yes" to install prompts.

#### Option 2: Using globally installed package

If you've installed the package globally (`npm install -g postgres-mysql-mcp-server`):

```json
{
  "mcpServers": {
    "sql": {
      "command": "postgres-mysql-mcp-server",
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

#### Option 3: Using local installation

If you've installed the package locally in your project:

```json
{
  "mcpServers": {
    "sql": {
      "command": "node",
      "args": ["./node_modules/postgres-mysql-mcp-server/index.js"],
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

#### Option 4: Development setup (for local development)

If you're developing locally and have cloned the repository:

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

### Example: Using with Cursor AI

Once configured, you can interact with your database through natural language:

**Example Conversation:**

```
You: "What tables are in my database?"
AI: [Uses list_tables tool] "Your database contains: users, orders, products, categories"

You: "Show me the structure of the users table"
AI: [Uses describe_table tool] "The users table has: id (integer), email (varchar), created_at (timestamp)..."

You: "Create an API endpoint to get user by ID"
AI: [Uses describe_table to understand schema, then generates code]
     "Here's the endpoint matching your users table structure..."
```

The AI assistant automatically uses the appropriate MCP tools to query your database and provide accurate, schema-aware responses.

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

