#!/usr/bin/env node
import { NileMcpServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    process.stdout.write(`[STARTUP] ${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}\n`);
  },
  error: (message: string, error?: any) => {
    process.stderr.write(`[ERROR] ${message}${error ? ' ' + JSON.stringify(error, null, 2) : ''}\n`);
  }
};

log.info('Starting Nile MCP Server...');

// Load environment variables from .env file
log.info('Loading environment variables...');
dotenv.config();

const apiKey = process.env.NILE_API_KEY;
const workspaceSlug = process.env.NILE_WORKSPACE_SLUG;

if (!apiKey) {
  log.error('NILE_API_KEY environment variable is required');
  process.exit(1);
}

if (!workspaceSlug) {
  log.error('NILE_WORKSPACE_SLUG environment variable is required');
  process.exit(1);
}

log.info('Environment variables loaded successfully', {
  workspaceSlug,
  apiKeyPresent: !!apiKey
});

// Create and start server
log.info('Creating server instance...');
const server = new NileMcpServer({
  apiKey,
  workspaceSlug
});

// Set up stdio transport
log.info('Setting up stdio transport...');
const transport = new StdioServerTransport();

async function main() {
  try {
    log.info('Connecting server to transport...');
    await server.connect(transport);
    log.info('Server started successfully');
  } catch (error) {
    log.error('Server error:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  log.info('Received SIGINT signal, shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM signal, shutting down...');
  await server.close();
  process.exit(0);
});

main(); 