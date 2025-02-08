import { z } from 'zod';
import { NileDatabase, NileError, DatabaseCredential, SqlQueryResult, SqlQueryError } from './types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';
import { log } from './logger.js';

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

export const getConnectionStringSchema = z.object({
  databaseName: z.string().describe('Name of the database to get connection string for')
});

// SQL Query Schema
export const executeSqlSchema = z.object({
  databaseName: z.string().describe('Name of the database to query'),
  query: z.string().describe('SQL query to execute'),
  connectionString: z.string().describe('Connection string to use for the query').optional()
});

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

export const getConnectionString = async (
  args: z.infer<typeof getConnectionStringSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Getting connection string', { databaseName: args.databaseName });
    
    // First, create credentials for the database
    const credentialUrl = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials`;
    const credentialResponse = await fetch(credentialUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    const credentialData = await credentialResponse.json();
    log.api('POST', credentialUrl, credentialResponse.status, credentialData);

    if (!credentialResponse.ok) {
      const error: NileError = credentialData;
      log.error('Failed to create credentials', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to create credentials: ${error.message}`
        }],
        isError: true
      };
    }
    log.info('Credential data', credentialData);
    const user_id = credentialData.id;
    const password = credentialData.password;

    if (!password) {
      log.error('Password not found in credential response');
      return {
        content: [{
          type: 'text',
          text: 'Failed to get credentials: Password not found in response'
        }],
        isError: true
      };
    }

    // Next, get database details to know the region
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

    // Construct connection string using credential details and database region
    const region = dbData.region.replace('AWS_', '').replace(/_/g, '-').toLowerCase();
    const host = `${region.toLowerCase()}.db.thenile.dev`;
    const connectionString = `postgres://${user_id}:${password}@${host}:5432/${args.databaseName}`;
    log.info('Connection string generated', { connectionString });
    
    return {
      content: [{
        type: 'text',
        text: `Connection string:\n${connectionString}\n\nIMPORTANT: This connection string contains credentials that will not be shown again.`
      }],
      isError: false
    };
  } catch (error) {
    log.error('Error getting connection string', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while getting connection string'
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
    
    let connResult;
    if (args.connectionString) {
      connResult = {
        content: [{
          type: 'text',
          text: `Connection string:\n${args.connectionString}\n\nIMPORTANT: This connection string contains credentials that will not be shown again.`
        }],
        isError: false
      };
    } else {
      connResult = await getConnectionString({ databaseName: args.databaseName }, context);
      if (connResult.isError) {
        return connResult;
      }
    }

    // Extract connection string from the result
    const resultText = connResult.content[0].text as string;
    const lines = resultText.split('\n');
    const connectionString = lines[1].trim(); // The connection string is on the first line
    
    // Extract user id:password and host from the connection string
    const [protocol, userPasswordHost] = connectionString.split('://');
    const [userPassword, hostDbname] = userPasswordHost.split('@');
    const [user, password] = userPassword.split(':');
    const [hostPort, dbname] = hostDbname.split('/');
    const [host, port] = hostPort.split(':');
    log.info('User', user);
    log.info('Password', password);
    log.info('Host', host);
    log.info('Port', port);
    log.info('Database', dbname);
    
    // Create client with connection string
    const client = new pg.Client({
      user: user,
      password: password,
      host: host,
      port: parseInt(port),
      database: dbname,
      ssl: {
        rejectUnauthorized: false
      }
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