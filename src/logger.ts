import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Create logs directory relative to project root
const projectRoot = process.cwd();
let logsDir = path.join(projectRoot, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error: any) {
    console.error(`Failed to create logs directory: ${error.message}`);
    // Fall back to temp directory if we can't create in project directory
    const tempDir = path.join(os.tmpdir(), 'nile-mcp-server-logs');
    fs.mkdirSync(tempDir, { recursive: true });
    logsDir = tempDir;
  }
}

// Configure log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create file transport with daily rotation
const fileTransport = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'nile-mcp-server-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // Keep logs for 14 days
  maxSize: '20m',  // Rotate when file reaches 20MB
  format: logFormat
});

// Create debug file transport
const debugFileTransport = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'debug-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '3d', // Keep debug logs for 3 days
  maxSize: '20m',
  format: logFormat,
  level: 'debug'
});

// Create console transport with custom format for stderr
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg + '\n';  // Ensure newline at end
  })
);

// Custom transport that writes to stderr
const stderrTransport = new winston.transports.Stream({
  stream: process.stderr,
  format: consoleFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    fileTransport,
    debugFileTransport,
    stderrTransport
  ]
});

// Helper functions for different log types
export const log = {
  info: (message: string, data?: any) => {
    logger.info(message, data);
  },
  error: (message: string, error?: any) => {
    logger.error(message, error);
  },
  debug: (message: string, data?: any) => {
    logger.debug(message, data);
  },
  api: (method: string, url: string, status: number, data?: any) => {
    logger.info(`${method} ${url} - Status: ${status}`, { type: 'api', data });
  },
  sql: (query: string, duration: number, result?: any) => {
    logger.info(`Query executed in ${duration}ms: ${query}`, { type: 'sql', result });
  },
  startup: (message: string, data?: any) => {
    logger.info(message, { type: 'startup', ...data });
  },
  mcp: {
    in: (message: any) => {
      logger.debug('MCP IN', { type: 'mcp', direction: 'in', message });
    },
    out: (message: any) => {
      logger.debug('MCP OUT', { type: 'mcp', direction: 'out', message });
    },
    error: (error: any) => {
      logger.error('MCP ERROR', { type: 'mcp', error });
    }
  }
};

export default log; 