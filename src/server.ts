import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createDatabase,
  listDatabases,
  getDatabase,
  deleteDatabase,
  getConnectionString,
  executeSQL,
  createDatabaseSchema,
  getDatabaseSchema,
  deleteDatabaseSchema,
  getConnectionStringSchema,
  executeSqlSchema,
  type ToolContext
} from './tools.js';
import { log } from './logger.js';

export interface NileServerOptions {
  apiKey: string;
  workspaceSlug: string;
}

export class NileMcpServer extends McpServer {
  private apiKey: string;
  private workspaceSlug: string;
  private readonly baseUrl = 'https://global.thenile.dev';
  private toolContext: ToolContext;

  constructor(options: NileServerOptions) {
    super({
      name: 'nile-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: true
      }
    });

    log.info('Initializing Nile MCP Server', {
      workspaceSlug: options.workspaceSlug,
      baseUrl: this.baseUrl
    });

    this.apiKey = options.apiKey;
    this.workspaceSlug = options.workspaceSlug;
    this.toolContext = {
      apiKey: this.apiKey,
      workspaceSlug: this.workspaceSlug,
      baseUrl: this.baseUrl
    };

    this.setupTools();
    log.info('Tools initialized successfully');
  }

  async connect(transport: any): Promise<void> {
    log.info('Connecting to transport...');
    await super.connect(transport);
    log.info('Connected successfully');
  }

  async close(): Promise<void> {
    log.info('Closing server connection...');
    await super.close();
    log.info('Server connection closed');
  }

  private setupTools(): void {
    log.info('Setting up tools...');

    // Database Management
    this.tool(
      'create-database',
      'Creates a new Nile database',
      createDatabaseSchema.shape,
      (args) => createDatabase(args, this.toolContext)
    );

    this.tool(
      'list-databases',
      'Lists all databases in the workspace',
      {},
      () => listDatabases(this.toolContext)
    );

    this.tool(
      'get-database',
      'Gets details of a specific database',
      getDatabaseSchema.shape,
      (args) => getDatabase(args, this.toolContext)
    );

    this.tool(
      'delete-database',
      'Deletes a database',
      deleteDatabaseSchema.shape,
      (args) => deleteDatabase(args, this.toolContext)
    );

    // Connection Management
    this.tool(
      'get-connection-string',
      'Gets a PostgreSQL connection string with fresh credentials',
      getConnectionStringSchema.shape,
      (args) => getConnectionString(args, this.toolContext)
    );

    // SQL Query Execution
    this.tool(
      'execute-sql',
      'Executes a SQL query on a Nile database',
      executeSqlSchema.shape,
      (args) => executeSQL(args, this.toolContext)
    );

    log.info('All tools registered successfully');
  }
}
