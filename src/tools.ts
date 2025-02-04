import { z } from 'zod';
import { ToolResult } from './types';

export const NILE_TOOLS = [
  {
    name: 'create-database',
    description: 'Create a new Nile database',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        region: { type: 'string', enum: ['aws-us-east-1'] }  // Add more regions as needed
      },
      required: ['name']
    }
  }
] as const;

export type NileToolName = typeof NILE_TOOLS[number]['name'];

export interface ToolHandlers {
  'create-database': (params: { name: string; region?: string }) => Promise<ToolResult>;
} 