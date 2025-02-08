#!/usr/bin/env node
import { NileMcpServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { log } from './logger.js';

log.startup('Starting Nile MCP Server...');

// Load environment variables from .env file
log.startup('Loading environment variables...');
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

log.startup('Environment variables loaded successfully', {
  workspaceSlug,
  apiKeyPresent: !!apiKey
});

// Create and start server
log.startup('Creating server instance...');
const server = new NileMcpServer({
  apiKey,
  workspaceSlug
});

// Set up stdio transport
log.startup('Setting up stdio transport...');
const transport = new StdioServerTransport();

async function main() {
  try {
    log.startup('Connecting server to transport...');
    await server.connect(transport);
    log.startup('Server started successfully');
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