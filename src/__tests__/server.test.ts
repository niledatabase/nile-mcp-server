import { NileMcpServer } from '../server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DatabaseCredential, NileDatabase } from '../types.js';

// Mock pg module
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  };
  return { Client: jest.fn(() => mockClient) };
});

describe('NileMcpServer', () => {
  let server: NileMcpServer;
  let client: Client;
  let transport1: InMemoryTransport;
  let transport2: InMemoryTransport;
  let pgClient: any;

  beforeEach(async () => {
    // Reset pg mock
    const pg = require('pg');
    pgClient = new pg.Client();
    pgClient.connect.mockReset();
    pgClient.query.mockReset();
    pgClient.end.mockReset();

    // Set up server
    server = new NileMcpServer({ 
      apiKey: 'test-api-key',
      workspaceSlug: 'test-workspace'
    });
    
    // Set up transport and client
    [transport1, transport2] = InMemoryTransport.createLinkedPair();
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    });
    
    // Connect server and client
    await server.connect(transport1);
    await client.connect(transport2);
  });

  afterEach(async () => {
    try {
      if (transport1) await transport1.close().catch(() => {});
      if (transport2) await transport2.close().catch(() => {});
      if (server) await server.close().catch(() => {});
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  describe('tools', () => {
    it('should list available tools', async () => {
      const tools = await client.listTools();
      expect(tools.tools).toHaveLength(11);
      
      // Database Management Tools
      expect(tools.tools).toContainEqual({
        name: 'create-database',
        description: 'Creates a new Nile database',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the database'
            },
            region: {
              type: 'string',
              enum: ['AWS_US_WEST_2', 'AWS_EU_CENTRAL_1'],
              description: 'Region where the database should be created'
            }
          },
          required: ['name', 'region'],
          additionalProperties: false
        }
      });

      expect(tools.tools).toContainEqual({
        name: 'list-databases',
        description: 'Lists all databases in the workspace',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      });

      expect(tools.tools).toContainEqual({
        name: 'get-database',
        description: 'Gets details of a specific database',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the database to get details for'
            }
          },
          required: ['name'],
          additionalProperties: false
        }
      });

      expect(tools.tools).toContainEqual({
        name: 'delete-database',
        description: 'Deletes a database',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the database to delete'
            }
          },
          required: ['name'],
          additionalProperties: false
        }
      });

      // Connection String Tool
      expect(tools.tools).toContainEqual({
        name: 'get-connection-string',
        description: 'Gets a PostgreSQL connection string with fresh credentials',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            databaseName: {
              type: 'string',
              description: 'Name of the database to get connection string for'
            }
          },
          required: ['databaseName'],
          additionalProperties: false
        }
      });

      // SQL Query Tool
      expect(tools.tools).toContainEqual({
        name: 'execute-sql',
        description: 'Executes a SQL query on a Nile database',
        inputSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            databaseName: {
              type: 'string',
              description: 'Name of the database to query'
            },
            query: {
              type: 'string',
              description: 'SQL query to execute'
            },
            connectionString: {
              type: 'string',
              description: 'Connection string to use for the query'
            }
          },
          required: ['databaseName', 'query'],
          additionalProperties: false
        }
      });
    });

    describe('Connection String Management', () => {
      it('should get connection string successfully', async () => {
        const mockDatabase: NileDatabase = {
          id: 'db-123',
          name: 'test-db',
          region: 'AWS_US_WEST_2',
          status: 'READY',
          apiHost: 'api.test.thenile.dev',
          dbHost: 'us-west-2.db.thenile.dev',
          workspace: {
            name: 'test',
            slug: 'test-workspace'
          }
        };

        global.fetch = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'cred-123',
              password: 'test-password'
            })
          }))
          .mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDatabase)
          }));

        const result = await client.callTool({
          name: 'get-connection-string',
          arguments: {
            databaseName: 'test-db'
          }
        }) as CallToolResult;

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('postgres://cred-123:test-password@us-west-2.db.thenile.dev:5432/test-db');
      });

      it('should handle connection string errors', async () => {
        global.fetch = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'NotFound',
              message: 'Database not found',
              status: 404
            })
          }));

        const result = await client.callTool({
          name: 'get-connection-string',
          arguments: {
            databaseName: 'nonexistent-db'
          }
        }) as CallToolResult;

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Failed to create credentials: Database not found');
      });
    });

    describe('SQL Query Execution', () => {
      beforeEach(() => {
        // Mock credential response
        global.fetch = jest.fn()
          .mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'cred-123',
              password: 'test-password'
            })
          }))
          .mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'db-123',
              name: 'test-db',
              region: 'AWS_US_WEST_2',
              status: 'READY',
              apiHost: 'api.test.thenile.dev',
              dbHost: 'us-west-2.db.thenile.dev',
              workspace: {
                name: 'test',
                slug: 'test-workspace'
              }
            })
          }));
      });

      it('should execute SQL query successfully', async () => {
        pgClient.query.mockResolvedValueOnce({
          rows: [{ id: 1, name: 'Test' }],
          rowCount: 1,
          fields: [
            { name: 'id', dataTypeID: 23 },
            { name: 'name', dataTypeID: 25 }
          ]
        });

        const result = await client.callTool({
          name: 'execute-sql',
          arguments: {
            databaseName: 'test-db',
            query: 'SELECT * FROM test'
          }
        }) as CallToolResult;

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('| id | name |');
        expect(result.content[0].text).toContain('| 1 | Test |');
        expect(result.content[0].text).toContain('1 rows returned');
      });

      it('should handle SQL syntax errors', async () => {
        pgClient.query.mockRejectedValueOnce({
          message: 'syntax error at or near "SLECT"',
          position: '1',
          hint: 'Perhaps you meant "SELECT"'
        });

        const result = await client.callTool({
          name: 'execute-sql',
          arguments: {
            databaseName: 'test-db',
            query: 'SLECT * FROM test'
          }
        }) as CallToolResult;

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('syntax error');
        expect(result.content[0].text).toContain('Perhaps you meant "SELECT"');
      });

      it('should handle empty result sets', async () => {
        pgClient.query.mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          fields: []
        });

        const result = await client.callTool({
          name: 'execute-sql',
          arguments: {
            databaseName: 'test-db',
            query: 'SELECT * FROM test WHERE 1=0'
          }
        }) as CallToolResult;

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('0 rows returned');
      });
    });
  });
}); 