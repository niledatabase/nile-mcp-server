import { z } from 'zod';
import { NileDatabase, NileError, DatabaseCredential, SqlQueryResult, SqlQueryError } from './types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';

export interface ToolContext {
  apiKey: string;
  workspaceSlug: string;
  baseUrl: string;
}

// Schema Definitions
export const createDatabaseSchema = z.object({
  name: z.string().describe('Name of the database'),
  region: z.enum(['AWS_US_WEST_2', 'AWS_EU_CENTRAL_1']).describe('Region where the database should be created')
});

export const getDatabaseSchema = z.object({
  name: z.string().describe('Name of the database to get details for')
});

export const deleteDatabaseSchema = z.object({
  name: z.string().describe('Name of the database to delete')
});

export const listCredentialsSchema = z.object({
  databaseName: z.string().describe('Name of the database to list credentials for')
});

export const createCredentialSchema = z.object({
  databaseName: z.string().describe('Name of the database to create credentials for')
});

// SQL Query Schema
export const executeSqlSchema = z.object({
  databaseName: z.string().describe('Name of the database to query'),
  query: z.string().describe('SQL query to execute'),
  credentialId: z.string().optional().describe('Optional credential ID to use for the connection')
});

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    process.stdout.write(`[INFO] ${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}\n`);
  },
  error: (message: string, error?: any) => {
    process.stderr.write(`[ERROR] ${message}${error ? ' ' + JSON.stringify(error, null, 2) : ''}\n`);
  },
  api: (method: string, url: string, status: number, data?: any) => {
    process.stdout.write(`[API] ${method} ${url} - Status: ${status}${data ? ' ' + JSON.stringify(data, null, 2) : ''}\n`);
  },
  sql: (query: string, duration: number, result?: any) => {
    process.stdout.write(`[SQL] Query executed in ${duration}ms: ${query}${result ? ' ' + JSON.stringify(result, null, 2) : ''}\n`);
  }
};

// Tool Implementations
export const createDatabase = async (
  args: z.infer<typeof createDatabaseSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Creating database', { name: args.name, region: args.region });
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        databaseName: args.name,
        region: args.region
      })
    });

    const data = await response.json();
    log.api('POST', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to create database', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to create database: ${error.message}`
        }],
        isError: true
      };
    }

    const database: NileDatabase = data;
    log.info('Database created successfully', database);
    return {
      content: [{
        type: 'text',
        text: `Database "${database.name}" created successfully with ID ${database.id} in region ${database.region}. Status: ${database.status}`
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error creating database', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while creating database'
      }],
      isError: true
    };
  }
};

export const listDatabases = async (context: ToolContext): Promise<CallToolResult> => {
  try {
    log.info('Listing databases');
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const data = await response.json();
    log.api('GET', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to list databases', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to list databases: ${error.message}`
        }],
        isError: true
      };
    }

    const databases: NileDatabase[] = data;
    log.info(`Found ${databases.length} databases`);
    return {
      content: [{
        type: 'text',
        text: `Found ${databases.length} databases:\n\n` + 
          databases.map(db => 
            `- ${db.name} (ID: ${db.id})\n  Region: ${db.region}\n  Status: ${db.status}`
          ).join('\n')
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error listing databases', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while listing databases'
      }],
      isError: true
    };
  }
};

export const getDatabase = async (
  args: z.infer<typeof getDatabaseSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Getting database details', { name: args.name });
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.name}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const data = await response.json();
    log.api('GET', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to get database details', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get database details: ${error.message}`
        }],
        isError: true
      };
    }

    const database: NileDatabase = data;
    log.info('Database details retrieved successfully', database);
    return {
      content: [{
        type: 'text',
        text: `Database Details:\n` +
          `Name: ${database.name}\n` +
          `ID: ${database.id}\n` +
          `Region: ${database.region}\n` +
          `Status: ${database.status}\n` +
          `API Host: ${database.apiHost}\n` +
          `DB Host: ${database.dbHost || 'Not available'}`
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error getting database details', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while getting database details'
      }],
      isError: true
    };
  }
};

export const deleteDatabase = async (
  args: z.infer<typeof deleteDatabaseSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Deleting database', { name: args.name });
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.name}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const data = await response.json();
    log.api('DELETE', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to delete database', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to delete database: ${error.message}`
        }],
        isError: true
      };
    }

    log.info('Database deleted successfully', { name: args.name });
    return {
      content: [{
        type: 'text',
        text: `Database "${args.name}" has been successfully deleted.`
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error deleting database', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while deleting database'
      }],
      isError: true
    };
  }
};

export const listCredentials = async (
  args: z.infer<typeof listCredentialsSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Listing credentials', { databaseName: args.databaseName });
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const data = await response.json();
    log.api('GET', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to list credentials', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to list credentials: ${error.message}`
        }],
        isError: true
      };
    }

    const credentials: DatabaseCredential[] = data;
    log.info(`Found ${credentials.length} credentials for database ${args.databaseName}`);
    return {
      content: [{
        type: 'text',
        text: `Found ${credentials.length} credentials:\n\n` +
          credentials.map(cred => 
            `- ID: ${cred.id}\n  Username: ${cred.username}\n  Created: ${cred.created}`
          ).join('\n')
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error listing credentials', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while listing credentials'
      }],
      isError: true
    };
  }
};

export const createCredential = async (
  args: z.infer<typeof createCredentialSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Creating credential', { databaseName: args.databaseName });
    
    const url = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    log.api('POST', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to create credential', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to create credential: ${error.message}`
        }],
        isError: true
      };
    }

    const credential: DatabaseCredential = data;
    log.info('Credential created successfully', {
      id: credential.id,
      username: credential.username,
      created: credential.created
    });
    
    return {
      content: [{
        type: 'text',
        text: `Database credential created successfully:\n` +
          `ID: ${credential.id}\n` +
          `Username: ${credential.username}\n` +
          `Password: ${credential.password}\n\n` +
          `IMPORTANT: Save this password now. It will not be shown again.`
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error creating credential', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while creating credential'
      }],
      isError: true
    };
  }
};

export const listRegions = async (context: ToolContext): Promise<CallToolResult> => {
  try {
    log.info('Listing available regions');
    
    const url = `${context.baseUrl}/regions`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const data = await response.json();
    log.api('GET', url, response.status, data);

    if (!response.ok) {
      const error: NileError = data;
      log.error('Failed to list regions', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to list regions: ${error.message}`
        }],
        isError: true
      };
    }

    const regions: string[] = data;
    log.info(`Found ${regions.length} available regions`, { regions });
    return {
      content: [{
        type: 'text',
        text: `Available regions:\n\n` +
          regions.map(region => `- ${region}`).join('\n')
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error listing regions', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while listing regions'
      }],
      isError: true
    };
  }
};

export const executeSQL = async (
  args: z.infer<typeof executeSqlSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Executing SQL query', { database: args.databaseName, query: args.query });
    
    // Get database details
    const dbUrl = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}`;
    const dbResponse = await fetch(dbUrl, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const dbData = await dbResponse.json();
    log.api('GET', dbUrl, dbResponse.status, dbData);

    if (!dbResponse.ok) {
      const error: NileError = dbData;
      log.error('Failed to get database details', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get database details: ${error.message}`
        }],
        isError: true
      };
    }

    const database: NileDatabase = dbData;
    
    // Get or create credentials
    let credential: DatabaseCredential;
    if (args.credentialId) {
      log.info('Using existing credential', { credentialId: args.credentialId });
      const credUrl = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials/${args.credentialId}`;
      const credResponse = await fetch(credUrl, {
        headers: {
          'Authorization': `Bearer ${context.apiKey}`,
        }
      });

      const credData = await credResponse.json();
      log.api('GET', credUrl, credResponse.status, credData);

      if (!credResponse.ok) {
        const error: NileError = credData;
        log.error('Failed to get credential', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to get credential: ${error.message}`
          }],
          isError: true
        };
      }
      credential = credData;
    } else {
      log.info('Creating new credential');
      const credUrl = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials`;
      const credResponse = await fetch(credUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      const credData = await credResponse.json();
      log.api('POST', credUrl, credResponse.status, credData);

      if (!credResponse.ok) {
        const error: NileError = credData;
        log.error('Failed to create credential', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to create credential: ${error.message}`
          }],
          isError: true
        };
      }
      credential = credData;
    }

    if (!credential.password) {
      log.error('No password available for credential');
      return {
        content: [{
          type: 'text',
          text: 'No password available for the credential. Please create a new credential.'
        }],
        isError: true
      };
    }

    // Connect to database
    log.info('Connecting to database', { host: database.dbHost, database: database.name });
    const client = new pg.Client({
      host: database.dbHost,
      port: 5432,
      database: database.name,
      user: credential.username,
      password: credential.password,
      ssl: true
    });

    try {
      await client.connect();
      log.info('Database connection established');
      
      // Execute query
      const startTime = Date.now();
      const result = await client.query(args.query);
      const duration = Date.now() - startTime;
      
      // Format the result
      const queryResult: SqlQueryResult = {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map(f => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        }))
      };

      log.sql(args.query, duration, {
        rowCount: queryResult.rowCount,
        fieldCount: queryResult.fields.length
      });

      // Create a formatted table string
      let responseText = '';
      
      // Add field names as header
      if (queryResult.fields.length > 0) {
        responseText += '| ' + queryResult.fields.map(f => f.name).join(' | ') + ' |\n';
        responseText += '|' + queryResult.fields.map(() => '---').join('|') + '|\n';
      }

      // Add rows
      if (queryResult.rows.length > 0) {
        responseText += queryResult.rows.map(row => {
          return '| ' + queryResult.fields.map(f => String(row[f.name] ?? 'NULL')).join(' | ') + ' |';
        }).join('\n');
      }

      // Add summary
      responseText += `\n\n${queryResult.rowCount ?? 0} rows returned.`;

      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Query execution failed';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('SQL execution error', pgError);
      return {
        content: [{
          type: 'text',
          text: errorMessage
        }],
        isError: true
      };
    } finally {
      await client.end();
      log.info('Database connection closed');
    }

  } catch (error) {
    log.error('Error executing SQL query', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while executing SQL query'
      }],
      isError: true
    };
  }
}; 