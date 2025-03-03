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
  createTenant,
  deleteTenant,
  listTenants,
  createTenantSchema,
  deleteTenantSchema,
  listTenantsSchema,
  listResources,
  readResource,
  listResourcesSchema,
  readResourceSchema,
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

    // Add request handler logging
    const server = (this as any)['server'];
    if (server && typeof server.handleRequest === 'function') {
      const originalHandleRequest = server.handleRequest.bind(server);
      server.handleRequest = async (request: any, extra?: any) => {
        log.debug('MCP Server handling request', {
          method: request.method,
          params: request.params,
          id: request.id,
          registeredTools: Object.keys((this as any)['_registeredTools'] || {}),
          toolsEnabled: (this as any)['capabilities']?.tools,
          requestType: request.method === 'tools.call' ? 'Tool Call' : request.method
        });

        if (request.method === 'tools.call') {
          const toolName = request.params?.name;
          const toolArgs = request.params?.arguments;
          log.debug('Tool call details', {
            toolName,
            toolArgs,
            toolExists: (this as any)['_registeredTools']?.[toolName] !== undefined,
            toolSchema: (this as any)['_registeredTools']?.[toolName]?.schema
          });
        }

        try {
          const result = await originalHandleRequest(request, extra);
          log.debug('MCP Server request handled successfully', {
            method: request.method,
            id: request.id,
            result
          });
          return result;
        } catch (error) {
          log.error('MCP Server request handling error', {
            method: request.method,
            id: request.id,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name
            } : error
          });
          throw error;
        }
      };
    }
  }

  async connect(transport: any): Promise<void> {
    log.info('Connecting to transport...');
    log.debug('Transport details:', {
      type: transport.constructor.name,
      transport
    });
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
      'list-resources',
      'Lists all tables and their descriptions in the specified database',
      listResourcesSchema.shape,
      (args) => {
        log.debug('Tool list-resources called with args:', args);
        return listResources(args, this.toolContext);
      }
    );

    this.tool(
      'create-database',
      'Creates a new Nile database',
      createDatabaseSchema.shape,
      (args) => {
        log.debug('Tool create-database called with args:', args);
        return createDatabase(args, this.toolContext);
      }
    );

    this.tool(
      'list-databases',
      'Lists all databases in the workspace',
      {},
      () => {
        log.debug('Tool list-databases called');
        return listDatabases(this.toolContext);
      }
    );

    this.tool(
      'get-database',
      'Gets details of a specific database',
      getDatabaseSchema.shape,
      (args) => {
        log.debug('Tool get-database called with args:', args);
        return getDatabase(args, this.toolContext);
      }
    );

    this.tool(
      'delete-database',
      'Deletes a database',
      deleteDatabaseSchema.shape,
      (args) => {
        log.debug('Tool delete-database called with args:', args);
        return deleteDatabase(args, this.toolContext);
      }
    );

    // Connection Management
    this.tool(
      'get-connection-string',
      'Gets a PostgreSQL connection string with fresh credentials',
      getConnectionStringSchema.shape,
      (args) => {
        log.debug('Tool get-connection-string called with args:', args);
        return getConnectionString(args, this.toolContext);
      }
    );

    // SQL Query Execution
    this.tool(
      'execute-sql',
      'Executes a SQL query on a Nile database',
      executeSqlSchema.shape,
      (args) => {
        log.debug('Tool execute-sql called with args:', args);
        return executeSQL(args, this.toolContext);
      }
    );

    // Tenant Management
    this.tool(
      'create-tenant',
      'Creates a new tenant in the specified database',
      createTenantSchema.shape,
      (args) => {
        log.debug('Tool create-tenant called with args:', args);
        return createTenant(args, this.toolContext);
      }
    );

    this.tool(
      'delete-tenant',
      'Deletes a tenant from the specified database',
      deleteTenantSchema.shape,
      (args) => {
        log.debug('Tool delete-tenant called with args:', args);
        return deleteTenant(args, this.toolContext);
      }
    );

    this.tool(
      'list-tenants',
      'Lists all tenants in the specified database',
      listTenantsSchema.shape,
      (args) => {
        log.debug('Tool list-tenants called with args:', args);
        return listTenants(args, this.toolContext);
      }
    );

    // Resource Management
    this.tool(
      'read-resource',
      'Gets detailed schema information for a specific table',
      readResourceSchema.shape,
      (args) => {
        log.debug('Tool read-resource called with args:', args);
        return readResource(args, this.toolContext);
      }
    );

    // Log registered tools
    log.debug('Registered tools:', {
      tools: Object.keys((this as any)['_registeredTools'] || {})
    });
    log.info('All tools registered successfully');
  }
}
