import { NileMcpServer } from '../server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

describe('NileMcpServer', () => {
  let server: NileMcpServer;
  let client: Client;
  let transport1: InMemoryTransport;
  let transport2: InMemoryTransport;

  beforeEach(async () => {
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
      expect(tools.tools).toHaveLength(1);
      expect(tools.tools[0]).toMatchObject({
        name: 'create-database',
        description: 'Creates a new Nile database',
        inputSchema: {
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
          required: ['name', 'region']
        }
      });
    });

    it('should create a database successfully', async () => {
      // Mock a successful API call
      global.fetch = jest.fn().mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'db-123',
            name: 'test-db',
            region: 'AWS_US_WEST_2',
            status: 'ACTIVE'
          })
        })
      );

      const result = await client.callTool({
        name: 'create-database',
        arguments: {
          name: 'test-db',
          region: 'AWS_US_WEST_2'
        }
      }) as CallToolResult;

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('created successfully');
    });

    it('should handle errors when creating a database', async () => {
      // Mock a failed API call
      global.fetch = jest.fn().mockImplementation(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'BadRequest',
            message: 'Invalid database name',
            status: 400
          })
        })
      );

      const result = await client.callTool({
        name: 'create-database',
        arguments: {
          name: 'invalid-db',
          region: 'AWS_US_WEST_2'
        }
      }) as CallToolResult;

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to create database');
    });
  });
}); 