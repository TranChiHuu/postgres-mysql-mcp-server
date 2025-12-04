#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class SQLMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'postgres-mysql-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.postgresPool = null;
    this.mysqlConnection = null;
    this.currentConfig = null;

    this.setupHandlers();
    this.setupErrorHandling();
    this.autoConnectFromEnv();
  }

  getConfigFromEnv() {
    // Check for PostgreSQL env vars
    const pgHost = process.env.DB_HOST || process.env.POSTGRES_HOST;
    const pgPort = process.env.DB_PORT || process.env.POSTGRES_PORT;
    const pgDatabase = process.env.DB_DATABASE || process.env.POSTGRES_DATABASE;
    const pgUser = process.env.DB_USER || process.env.POSTGRES_USER;
    const pgPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;
    const dbType = process.env.DB_TYPE || process.env.DATABASE_TYPE;

    // Check for MySQL env vars
    const mysqlHost = process.env.MYSQL_HOST;
    const mysqlPort = process.env.MYSQL_PORT;
    const mysqlDatabase = process.env.MYSQL_DATABASE;
    const mysqlUser = process.env.MYSQL_USER;
    const mysqlPassword = process.env.MYSQL_PASSWORD;

    // Determine database type
    let type = null;
    if (dbType) {
      type = dbType.toLowerCase() === 'mysql' ? 'mysql' : 'postgresql';
    } else if (mysqlHost || mysqlDatabase) {
      type = 'mysql';
    } else if (pgHost || pgDatabase) {
      type = 'postgresql';
    }

    if (!type) {
      return null;
    }

    if (type === 'postgresql') {
      if (!pgHost || !pgPort || !pgDatabase || !pgUser || !pgPassword) {
        return null;
      }
      return {
        type: 'postgresql',
        host: pgHost,
        port: parseInt(pgPort, 10),
        database: pgDatabase,
        user: pgUser,
        password: pgPassword,
        ssl: process.env.DB_SSL === 'true' || process.env.POSTGRES_SSL === 'true',
      };
    } else {
      if (!mysqlHost || !mysqlPort || !mysqlDatabase || !mysqlUser || !mysqlPassword) {
        return null;
      }
      return {
        type: 'mysql',
        host: mysqlHost,
        port: parseInt(mysqlPort, 10),
        database: mysqlDatabase,
        user: mysqlUser,
        password: mysqlPassword,
        ssl: process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true',
      };
    }
  }

  async autoConnectFromEnv() {
    const config = this.getConfigFromEnv();
    if (config) {
      try {
        await this.connectDatabase(config);
        console.error('Auto-connected to database using environment variables');
      } catch (error) {
        console.error('Failed to auto-connect from environment variables:', error);
      }
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'connect_database',
          description:
            'Connect to a PostgreSQL or MySQL database. Parameters can be provided directly or loaded from environment variables. If no parameters are provided, will use environment variables (DB_TYPE, DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD, DB_SSL). For PostgreSQL: POSTGRES_HOST, POSTGRES_PORT, etc. For MySQL: MYSQL_HOST, MYSQL_PORT, etc.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['postgresql', 'mysql'],
                description: 'Database type (optional if using env vars)',
              },
              host: {
                type: 'string',
                description: 'Database host (optional if using env vars)',
              },
              port: {
                type: 'number',
                description: 'Database port (optional if using env vars)',
              },
              database: {
                type: 'string',
                description: 'Database name (optional if using env vars)',
              },
              user: {
                type: 'string',
                description: 'Database user (optional if using env vars)',
              },
              password: {
                type: 'string',
                description: 'Database password (optional if using env vars)',
              },
              ssl: {
                type: 'boolean',
                description: 'Use SSL connection (optional)',
                default: false,
              },
            },
            required: [],
          },
        },
        {
          name: 'execute_query',
          description:
            'Execute a SQL query on the connected database. Returns query results.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute',
              },
              params: {
                type: 'array',
                description: 'Query parameters (for parameterized queries)',
                items: {
                  type: ['string', 'number', 'boolean', 'null'],
                },
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in the connected database',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'describe_table',
          description: 'Get schema information for a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to describe',
              },
            },
            required: ['tableName'],
          },
        },
        {
          name: 'disconnect_database',
          description: 'Disconnect from the current database',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'connect_database':
            return await this.connectDatabase(args);

          case 'execute_query':
            return await this.executeQuery(args.query, args.params);

          case 'list_tables':
            return await this.listTables();

          case 'describe_table':
            return await this.describeTable(args.tableName);

          case 'disconnect_database':
            return await this.disconnectDatabase();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message || String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async connectDatabase(config) {
    // Merge with environment variables if config is partial
    let finalConfig;
    
    if (!config.type || !config.host || !config.port || !config.database || !config.user || !config.password) {
      // Try to get missing values from env
      const envConfig = this.getConfigFromEnv();
      if (!envConfig) {
        throw new Error(
          'Incomplete database configuration. Provide all parameters or set environment variables:\n' +
          'For PostgreSQL: DB_TYPE=postgresql, DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD\n' +
          'For MySQL: DB_TYPE=mysql, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD'
        );
      }
      
      // Merge provided config with env config (provided values take precedence)
      finalConfig = {
        type: config.type || envConfig.type,
        host: config.host || envConfig.host,
        port: config.port || envConfig.port,
        database: config.database || envConfig.database,
        user: config.user || envConfig.user,
        password: config.password || envConfig.password,
        ssl: config.ssl !== undefined ? config.ssl : envConfig.ssl,
      };
    } else {
      finalConfig = config;
    }

    // Disconnect existing connections
    await this.disconnectDatabase();

    this.currentConfig = finalConfig;

    if (finalConfig.type === 'postgresql') {
      this.postgresPool = new Pool({
        host: finalConfig.host,
        port: finalConfig.port,
        database: finalConfig.database,
        user: finalConfig.user,
        password: finalConfig.password,
        ssl: finalConfig.ssl ? { rejectUnauthorized: false } : false,
        max: 10,
      });

      // Test connection
      const client = await this.postgresPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully connected to PostgreSQL database: ${finalConfig.database}@${finalConfig.host}:${finalConfig.port}`,
          },
        ],
      };
    } else if (finalConfig.type === 'mysql') {
      this.mysqlConnection = mysql.createPool({
        host: finalConfig.host,
        port: finalConfig.port,
        database: finalConfig.database,
        user: finalConfig.user,
        password: finalConfig.password,
        ssl: finalConfig.ssl ? {} : undefined,
        waitForConnections: true,
        connectionLimit: 10,
      });

      // Test connection
      await this.mysqlConnection.query('SELECT NOW()');

      return {
        content: [
          {
            type: 'text',
            text: `Successfully connected to MySQL database: ${finalConfig.database}@${finalConfig.host}:${finalConfig.port}`,
          },
        ],
      };
    } else {
      throw new Error(`Unsupported database type: ${finalConfig.type}`);
    }
  }

  async executeQuery(query, params) {
    if (!this.currentConfig) {
      throw new Error('Not connected to any database. Call connect_database first.');
    }

    if (this.currentConfig.type === 'postgresql') {
      if (!this.postgresPool) {
        throw new Error('PostgreSQL connection not initialized');
      }

      const result = await this.postgresPool.query(query, params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                rows: result.rows,
                rowCount: result.rowCount,
                fields: result.fields.map((f) => ({
                  name: f.name,
                  dataTypeID: f.dataTypeID,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (this.currentConfig.type === 'mysql') {
      if (!this.mysqlConnection) {
        throw new Error('MySQL connection not initialized');
      }

      const [rows, fields] = await this.mysqlConnection.query(query, params || []);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                rows: rows,
                rowCount: Array.isArray(rows) ? rows.length : 0,
                fields: fields?.map((f) => ({
                  name: f.name,
                  type: f.type,
                })) || [],
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      throw new Error(`Unsupported database type: ${this.currentConfig.type}`);
    }
  }

  async listTables() {
    if (!this.currentConfig) {
      throw new Error('Not connected to any database. Call connect_database first.');
    }

    if (this.currentConfig.type === 'postgresql') {
      if (!this.postgresPool) {
        throw new Error('PostgreSQL connection not initialized');
      }

      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      const result = await this.postgresPool.query(query);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                tables: result.rows.map((row) => row.table_name),
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (this.currentConfig.type === 'mysql') {
      if (!this.mysqlConnection) {
        throw new Error('MySQL connection not initialized');
      }

      const [rows] = await this.mysqlConnection.query(
        `SHOW TABLES FROM ${this.currentConfig.database}`
      );
      const tableKey = `Tables_in_${this.currentConfig.database}`;
      const tables = rows.map((row) => row[tableKey]);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                tables: tables,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      throw new Error(`Unsupported database type: ${this.currentConfig.type}`);
    }
  }

  async describeTable(tableName) {
    if (!this.currentConfig) {
      throw new Error('Not connected to any database. Call connect_database first.');
    }

    if (this.currentConfig.type === 'postgresql') {
      if (!this.postgresPool) {
        throw new Error('PostgreSQL connection not initialized');
      }

      const query = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const result = await this.postgresPool.query(query, [tableName]);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                table: tableName,
                columns: result.rows,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (this.currentConfig.type === 'mysql') {
      if (!this.mysqlConnection) {
        throw new Error('MySQL connection not initialized');
      }

      const [rows] = await this.mysqlConnection.query(
        `DESCRIBE ${tableName}`
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                table: tableName,
                columns: rows,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      throw new Error(`Unsupported database type: ${this.currentConfig.type}`);
    }
  }

  async disconnectDatabase() {
    if (this.postgresPool) {
      await this.postgresPool.end();
      this.postgresPool = null;
    }

    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      this.mysqlConnection = null;
    }

    this.currentConfig = null;

    return {
      content: [
        {
          type: 'text',
          text: 'Disconnected from database',
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.disconnectDatabase();
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP SQL Server running on stdio');
  }
}

const server = new SQLMCPServer();
server.run().catch((error) => {
  console.error(error);
});

