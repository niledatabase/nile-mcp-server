import express, { Express, Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { NileMcpServer, NileServerOptions } from '../server.js';
import { log } from '../logger.js';

export class SSEHandler {
  private app: Express;
  private server: NileMcpServer;
  private transport: SSEServerTransport | null = null;
  private sseResponse: Response | null = null;
  private port: number;

  constructor(options: NileServerOptions, port: number = 3000) {
    this.app = express();
    this.server = new NileMcpServer(options);
    this.port = port;

    // Add request logging middleware
    this.app.use((req: Request, res: Response, next) => {
      log.debug(`Incoming ${req.method} request to ${req.path}`, {
        headers: req.headers,
        body: req.body,
        query: req.query
      });
      next();
    });

    // Set up routes
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/sse', (req: Request, res: Response) => {
      log.info('New SSE connection request');
      log.debug('SSE connection details', {
        headers: req.headers,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // Set required SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Store the SSE response object
      this.sseResponse = res;

      // Create transport first
      this.transport = new SSEServerTransport('/messages', res);
      
      // Add transport event listeners
      this.transport.onclose = () => {
        log.debug('SSE connection closed');
        this.sseResponse = null;
      };

      this.transport.onerror = (error) => {
        log.error('SSE transport error', error);
      };

      // Handle client disconnect
      req.on('close', () => {
        log.debug('Client closed SSE connection');
        if (this.transport) {
          this.transport.close();
          this.transport = null;
          this.sseResponse = null;
        }
      });

      // Keep the connection alive with periodic heartbeats
      const heartbeat = setInterval(() => {
        if (!this.transport || !this.sseResponse || this.sseResponse.writableEnded) {
          log.debug('Clearing heartbeat - connection closed');
          clearInterval(heartbeat);
          return;
        }
        try {
          this.sseResponse.write('event: heartbeat\ndata: {"type":"ping"}\n\n');
          log.debug('Sent heartbeat');
        } catch (error) {
          log.error('Error sending heartbeat', error);
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Connect the transport to the server (this will automatically start it)
      this.server.connect(this.transport)
        .then(() => {
          log.debug('SSE transport connected successfully');
        })
        .catch(error => {
          log.error('Failed to connect transport', error);
          clearInterval(heartbeat);
          if (!res.writableEnded) {
            res.end();
          }
        });
    });

    this.app.post('/messages', async (req: Request, res: Response) => {
      log.debug("received message");

      if (!this.transport || !this.sseResponse) {
        log.debug('No active SSE connection for message');
        res.status(400).json({ 
          error: 'No active SSE connection. Please establish an SSE connection first at /sse'
        });
        return;
      }

      // Verify session ID if provided
      const sessionId = req.query.sessionId;
      if (sessionId && sessionId !== this.transport.sessionId) {
        log.debug('Invalid session ID', {
          provided: sessionId,
          expected: this.transport.sessionId
        });
        res.status(400).json({
          error: 'Invalid session ID'
        });
        return;
      }

      try {
        // Create a mock response object that writes to the SSE stream
        const mockRes = {
          write: (data: string) => {
            log.debug('Mock response write called', { data });
            if (this.sseResponse && !this.sseResponse.writableEnded) {
              try {
                // Parse the data to ensure it's valid JSON
                const jsonData = JSON.parse(data);
                log.debug('Sending SSE message', { data: jsonData });
                
                // Format as SSE message with JSON-RPC event
                this.sseResponse.write(`event: message\ndata: ${JSON.stringify(jsonData)}\n\n`);
                log.debug('SSE message sent successfully');
              } catch (error) {
                log.error('Error parsing/sending SSE message', { error, data });
              }
            } else {
              log.debug('SSE connection closed, cannot send message');
            }
            return true;
          },
          end: (msg: string) => {
            return true;
          },
          setHeader: (name: string, value: string) => {
            log.debug('Mock response setHeader called', { name, value });
            return mockRes;
          },
          writeHead: (status: number, headers?: any) => {
            log.debug('Mock response writeHead called', { status, headers });
            return mockRes;
          },
          getHeader: (name: string) => {
            log.debug('Mock response getHeader called', { name });
            return null;
          },
          hasHeader: (name: string) => {
            log.debug('Mock response hasHeader called', { name });
            return false;
          },
          // Add required properties for MCP protocol
          statusCode: 200,
          statusMessage: 'OK',
          headersSent: false
        };

        log.debug('Handling message with transport');

        // Send immediate acknowledgment
        res.status(202).json({ status: 'accepted' });

        try {

          // Handle the message using the mock response
          await this.transport.handlePostMessage(req, mockRes as any);
          log.debug('Response error',mockRes.end);
          log.debug('Message handled successfully');
        } catch (error) {
          log.error('Transport handlePostMessage error', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            transportState: {
              connected: this.transport !== null,
              sseResponseConnected: this.sseResponse !== null,
              sessionId: this.transport?.sessionId
            }
          });
          
          // Try to send error through SSE
          if (this.sseResponse && !this.sseResponse.writableEnded) {
            const errorMessage = {
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: error instanceof Error ? error.message : 'Unknown error'
              },
              id: req.body?.id
            };
            this.sseResponse.write(`event: message\ndata: ${JSON.stringify(errorMessage)}\n\n`);
          }

          // Send error response to POST request if not already sent
          if (!res.headersSent) {
            res.status(500).json({
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        log.error('Error handling message', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Try to send error through SSE if possible
        if (this.sseResponse && !this.sseResponse.writableEnded) {
          const errorMessage = {
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Unknown error'
            },
            id: req.body?.id
          };
          this.sseResponse.write(`event: message\ndata: ${JSON.stringify(errorMessage)}\n\n`);
        }
      }
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(this.port, () => {
        log.info(`SSE server listening on port ${this.port}`);
        log.debug('Server startup details', {
          port: this.port,
          mode: 'SSE',
          timestamp: new Date().toISOString(),
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        });
        resolve();
      });

      // Handle server errors
      server.on('error', (error) => {
        log.error('Server error', error);
      });
    });
  }

  public async stop(): Promise<void> {
    log.debug('Stopping SSE server');
    if (this.transport) {
      await this.server.close();
      this.transport = null;
      this.sseResponse = null;
      log.debug('SSE server stopped');
    }
  }
} 