import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { NileMcpServer } from '../server.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

interface ToolResponse {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError: boolean;
}

describe('NileMcpServer', () => {
  let server: NileMcpServer;
  let client: Client;
  let transport1: InMemoryTransport;
  let transport2: InMemoryTransport;

  beforeEach(async () => {
    // Set up server
    server = new NileMcpServer({ apiKey: 'test-api-key' });
    
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

  describe('listTools', () => {
    it('should return available tools', async () => {
      const tools = await client.listTools();
      expect(tools.tools).toHaveLength(1);
      expect(tools.tools[0]).toMatchObject({
        name: 'create-database',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the database'
            },
            region: {
              type: 'string',
              description: 'Region where the database should be created'
            }
          },
          required: ['name', 'region']
        }
      });
    });
  });

  describe('callTool', () => {
    it('should handle create-database tool call', async () => {
      const result = await client.callTool({
        name: 'create-database',
        arguments: {
          name: 'test-db',
          region: 'us-east-1'
        }
      }) as ToolResponse;
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Database test-db created successfully in region us-east-1'
      });
      expect(result.isError).toBe(false);
    });

    it('should handle invalid tool name', async () => {
      await expect(
        client.callTool({
          name: 'invalid-tool',
          arguments: {}
        })
      ).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      await expect(
        client.callTool({
          name: 'create-database',
          arguments: {}
        })
      ).rejects.toThrow('Invalid arguments for tool create-database');
    });
  });
}); 