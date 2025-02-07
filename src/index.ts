#!/usr/bin/env node
import { NileMcpServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const apiKey = process.env.NILE_API_KEY;
const workspaceSlug = process.env.NILE_WORKSPACE_SLUG;

if (!apiKey) {
  console.error('Error: NILE_API_KEY environment variable is required');
  process.exit(1);
}

if (!workspaceSlug) {
  console.error('Error: NILE_WORKSPACE_SLUG environment variable is required');
  process.exit(1);
}

// At this point TypeScript knows apiKey and workspaceSlug are not undefined
const server = new NileMcpServer({
  apiKey,
  workspaceSlug
});

// Set up stdio transport
const transport = new StdioServerTransport();

async function main() {
  try {
    await server.connect(transport);
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

main(); 