#!/usr/bin/env node
import dotenv from 'dotenv';
import { log } from './logger.js';
import { SSEHandler } from './handlers/sse.js';
import { StdioHandler } from './handlers/stdio.js';

log.startup('Starting Nile MCP Server...');

// Load environment variables from .env file
log.startup('Loading environment variables...');
dotenv.config();

const apiKey = process.env.NILE_API_KEY;
const workspaceSlug = process.env.NILE_WORKSPACE_SLUG;
const serverMode = process.env.MCP_SERVER_MODE || 'stdio';
const serverPort = parseInt(process.env.MCP_SERVER_PORT || '3000', 10);

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
  apiKeyPresent: !!apiKey,
  serverMode,
  serverPort
});

const serverOptions = {
  apiKey,
  workspaceSlug
};

async function main() {
  try {
    log.startup(`Starting server in ${serverMode} mode...`);

    if (serverMode === 'sse') {
      const handler = new SSEHandler(serverOptions, serverPort);
      await handler.start();
    } else if (serverMode === 'stdio') {
      const handler = new StdioHandler(serverOptions);
      await handler.start();
    } else {
      log.error(`Unknown server mode: ${serverMode}`);
      console.error('Available modes: sse, stdio (default)');
      process.exit(1);
    }
  } catch (error) {
    log.error('Server error:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  log.info('Received SIGINT signal, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM signal, shutting down...');
  process.exit(0);
});

main(); 