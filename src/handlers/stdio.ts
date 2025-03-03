import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NileMcpServer, NileServerOptions } from '../server.js';
import { log } from '../logger.js';

export class StdioHandler {
  private server: NileMcpServer;
  private transport: StdioServerTransport;

  constructor(options: NileServerOptions) {
    this.server = new NileMcpServer(options);
    this.transport = new StdioServerTransport();
  }

  public async start(): Promise<void> {
    try {
      log.info('Starting STDIO server...');
      await this.server.connect(this.transport);
      log.info('STDIO server started successfully');

      // Handle process signals
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
    } catch (error) {
      log.error('Failed to start STDIO server', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      log.info('Stopping STDIO server...');
      await this.server.close();
      log.info('STDIO server stopped successfully');
      process.exit(0);
    } catch (error) {
      log.error('Error stopping STDIO server', error);
      process.exit(1);
    }
  }
} 