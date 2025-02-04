#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NileMcpServer } from './server.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Please provide a Nile API key as a command-line argument');
    process.exit(1);
  }

  const apiKey = args[0];
  const server = new NileMcpServer({ apiKey });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 