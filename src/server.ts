import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NileDatabase, NileError, ToolResult } from './types.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const ListToolsRequestSchema = z.object({
  method: z.literal('tools/list')
});

const CallToolRequestSchema = z.object({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown())
  })
});

export interface NileServerOptions {
  apiKey: string;
  workspaceSlug: string;
}

export class NileMcpServer extends McpServer {
  private apiKey: string;
  private workspaceSlug: string;
  private readonly baseUrl = 'https://global.thenile.dev';

  constructor(options: NileServerOptions) {
    super({
      name: 'nile-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: true
      }
    });

    this.apiKey = options.apiKey;
    this.workspaceSlug = options.workspaceSlug;
    this.setupTools();
  }

  private setupTools(): void {
    const createDatabaseSchema = z.object({
      name: z.string().describe('Name of the database'),
      region: z.enum(['AWS_US_WEST_2', 'AWS_EU_CENTRAL_1']).describe('Region where the database should be created')
    });

    this.tool(
      'create-database',
      'Creates a new Nile database',
      createDatabaseSchema.shape,
      async (args: z.infer<typeof createDatabaseSchema>, extra: RequestHandlerExtra): Promise<CallToolResult> => {
        try {
          const response = await fetch(`${this.baseUrl}/workspaces/${this.workspaceSlug}/databases`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              databaseName: args.name,
              region: args.region
            })
          });

          if (!response.ok) {
            const error: NileError = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Failed to create database: ${error.message}`
              }],
              isError: true
            };
          }

          const database: NileDatabase = await response.json();
          return {
            content: [{
              type: 'text',
              text: `Database "${database.name}" created successfully with ID ${database.id} in region ${database.region}. Status: ${database.status}`
            }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: error instanceof Error ? error.message : 'Unknown error occurred while creating database'
            }],
            isError: true
          };
        }
      }
    );
  }
}
