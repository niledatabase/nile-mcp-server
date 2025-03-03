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

export const createTenantSchema = z.object({
  databaseName: z.string().describe('Name of the database to create tenant in'),
  name: z.string().describe('Name of the tenant')
});

export const deleteTenantSchema = z.object({
  databaseName: z.string().describe('Name of the database'),
  tenantId: z.string().describe('ID of the tenant to delete')
});

export const listTenantsSchema = z.object({
  databaseName: z.string().describe('Name of the database to list tenants from')
});

export const listResourcesSchema = z.object({
  databaseName: z.string().describe('Name of the database to list resources from')
});

export const readResourceSchema = z.object({
  databaseName: z.string().describe('Name of the database'),
  tableName: z.string().describe('Name of the table to get schema for')
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
    log.debug('getConnectionString tool called', { 
      args,
      context: {
        workspaceSlug: context.workspaceSlug,
        baseUrl: context.baseUrl
      }
    });
    
    // First, create credentials for the database
    const credentialUrl = `${context.baseUrl}/workspaces/${context.workspaceSlug}/databases/${args.databaseName}/credentials`;
    log.debug('getConnectionString creating credentials', { url: credentialUrl });
    
    const credentialResponse = await fetch(credentialUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    const credentialData = await credentialResponse.json();
    log.debug('getConnectionString credential response', { 
      status: credentialResponse.status,
      ok: credentialResponse.ok
    });

    if (!credentialResponse.ok) {
      const error: NileError = credentialData;
      log.error('getConnectionString failed to create credentials', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to create credentials: ${error.message}`
        }],
        isError: true
      };
    }

    log.debug('getConnectionString credentials created');
    const user_id = credentialData.id;
    const password = credentialData.password;

    if (!password) {
      log.error('getConnectionString password not found in credential response');
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
    log.debug('getConnectionString getting database details', { url: dbUrl });
    
    const dbResponse = await fetch(dbUrl, {
      headers: {
        'Authorization': `Bearer ${context.apiKey}`,
      }
    });

    const dbData = await dbResponse.json();
    log.debug('getConnectionString database response', { 
      status: dbResponse.status,
      ok: dbResponse.ok
    });

    if (!dbResponse.ok) {
      const error: NileError = dbData;
      log.error('getConnectionString failed to get database details', error);
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
    log.debug('getConnectionString connection string generated', { 
      region,
      host,
      user: user_id,
      database: args.databaseName
    });
    
    return {
      content: [{
        type: 'text',
        text: `Connection string:\n${connectionString}\n\nIMPORTANT: This connection string contains credentials that will not be shown again.`
      }],
      isError: false
    };
  } catch (error) {
    log.error('getConnectionString error', error);
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

export const createTenant = async (
  args: z.infer<typeof createTenantSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Creating tenant', { database: args.databaseName, name: args.name });
    
    // Get connection string for the database
    const connResult = await getConnectionString({ databaseName: args.databaseName }, context);
    if (connResult.isError) {
      return connResult;
    }

    // Extract connection string
    const resultText = connResult.content[0].text as string;
    const connectionString = resultText.split('\n')[1].trim();

    // Create client
    const client = new pg.Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      log.info('Database connection established');

      // Insert new tenant
      const insertQuery = `
        INSERT INTO tenants (name)
        VALUES ($1)
        RETURNING id, name, created, updated;
      `;
      
      const result = await client.query(insertQuery, [args.name]);
      const tenant = result.rows[0];

      log.info('Tenant created successfully', tenant);
      
      return {
        content: [{
          type: 'text',
          text: `Tenant created successfully:\n` +
            `ID: ${tenant.id}\n` +
            `Name: ${tenant.name}\n` +
            `Created: ${tenant.created}\n` +
            `Updated: ${tenant.updated}`
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Failed to create tenant';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('Tenant creation error', pgError);
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
    log.error('Error creating tenant', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while creating tenant'
      }],
      isError: true
    };
  }
};

export const deleteTenant = async (
  args: z.infer<typeof deleteTenantSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Deleting tenant', { database: args.databaseName, tenantId: args.tenantId });
    
    // Get connection string for the database
    const connResult = await getConnectionString({ databaseName: args.databaseName }, context);
    if (connResult.isError) {
      return connResult;
    }

    // Extract connection string
    const resultText = connResult.content[0].text as string;
    const connectionString = resultText.split('\n')[1].trim();

    // Create client
    const client = new pg.Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      log.info('Database connection established');

      // Delete tenant
      const deleteQuery = `
        DELETE FROM tenants
        WHERE id = $1
        RETURNING id, name;
      `;
      
      const result = await client.query(deleteQuery, [args.tenantId]);
      
      if (result.rowCount === 0) {
        return {
          content: [{
            type: 'text',
            text: `Tenant with ID ${args.tenantId} not found`
          }],
          isError: true
        };
      }

      const tenant = result.rows[0];
      log.info('Tenant deleted successfully', tenant);
      
      return {
        content: [{
          type: 'text',
          text: `Tenant "${tenant.name}" (ID: ${tenant.id}) has been successfully deleted.`
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Failed to delete tenant';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('Tenant deletion error', pgError);
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
    log.error('Error deleting tenant', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while deleting tenant'
      }],
      isError: true
    };
  }
};

export const listTenants = async (
  args: z.infer<typeof listTenantsSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Listing tenants', { database: args.databaseName });
    
    // Get connection string for the database
    const connResult = await getConnectionString({ databaseName: args.databaseName }, context);
    if (connResult.isError) {
      return connResult;
    }

    // Extract connection string
    const resultText = connResult.content[0].text as string;
    const connectionString = resultText.split('\n')[1].trim();

    // Create client
    const client = new pg.Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      log.info('Database connection established');

      // List tenants
      const listQuery = `
        SELECT id, name, created, updated
        FROM tenants
        WHERE deleted IS NULL
        ORDER BY created DESC;
      `;
      
      const result = await client.query(listQuery);
      
      if (result.rows.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No tenants found'
          }],
          isError: false
        };
      }

      // Create a formatted table string
      let responseText = '| ID | Name | Created | Updated |\n';
      responseText += '|---|---|---|---|\n';
      
      responseText += result.rows.map(tenant => {
        return `| ${tenant.id} | ${tenant.name} | ${tenant.created} | ${tenant.updated} |`;
      }).join('\n');

      responseText += `\n\n${result.rowCount} tenants found.`;

      log.info(`Found ${result.rowCount} tenants`);
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Failed to list tenants';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('Tenant listing error', pgError);
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
    log.error('Error listing tenants', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while listing tenants'
      }],
      isError: true
    };
  }
};

export const listResources = async (
  args: z.infer<typeof listResourcesSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.debug('listResources tool called', { 
      args,
      context: {
        workspaceSlug: context.workspaceSlug,
        baseUrl: context.baseUrl
      }
    });
    
    // Get connection string for the database
    const connResult = await getConnectionString({ databaseName: args.databaseName }, context);
    if (connResult.isError) {
      log.debug('listResources failed to get connection string', connResult);
      return connResult;
    }

    // Extract connection string
    const resultText = connResult.content[0].text as string;
    const connectionString = resultText.split('\n')[1].trim();
    log.debug('listResources got connection string');

    // Create client
    const client = new pg.Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      log.debug('listResources connected to database');

      // Get all tables from public schema
      const query = `
        SELECT 
          table_name,
          obj_description(('"' || table_schema || '"."' || table_name || '"')::regclass, 'pg_class') as description
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      
      log.debug('listResources executing query', { query });
      const result = await client.query(query);
      log.debug('listResources query result', { 
        rowCount: result.rowCount,
        fields: result.fields.map(f => f.name)
      });
      
      if (result.rows.length === 0) {
        log.debug('listResources found no tables');
        return {
          content: [{
            type: 'text',
            text: 'No tables found in the public schema'
          }],
          isError: false
        };
      }

      // Create a formatted table string
      let responseText = '| Table Name | Description |\n';
      responseText += '|------------|-------------|\n';
      
      responseText += result.rows.map(table => {
        const description = table.description || 'No description available';
        return `| ${table.table_name} | ${description} |`;
      }).join('\n');

      responseText += `\n\n${result.rowCount} tables found in the public schema.`;

      log.debug(`listResources found ${result.rowCount} tables`);
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Failed to list database resources';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('listResources database error', {
        error: pgError,
        message: errorMessage
      });
      return {
        content: [{
          type: 'text',
          text: errorMessage
        }],
        isError: true
      };
    } finally {
      await client.end();
      log.debug('listResources database connection closed');
    }

  } catch (error) {
    log.error('listResources error', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while listing database resources'
      }],
      isError: true
    };
  }
};

export const readResource = async (
  args: z.infer<typeof readResourceSchema>,
  context: ToolContext
): Promise<CallToolResult> => {
  try {
    log.info('Reading table schema', { database: args.databaseName, table: args.tableName });
    
    // Get connection string for the database
    const connResult = await getConnectionString({ databaseName: args.databaseName }, context);
    if (connResult.isError) {
      return connResult;
    }

    // Extract connection string
    const resultText = connResult.content[0].text as string;
    const connectionString = resultText.split('\n')[1].trim();

    // Create client
    const client = new pg.Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      log.info('Database connection established');

      // Get table schema details
      const query = `
        SELECT 
          c.column_name,
          c.data_type,
          c.character_maximum_length,
          c.is_nullable,
          c.column_default,
          c.numeric_precision,
          c.numeric_scale,
          pg_catalog.col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as column_description,
          tc.constraint_type
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu
          ON c.column_name = kcu.column_name 
          AND c.table_name = kcu.table_name
        LEFT JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
          AND kcu.table_name = tc.table_name
        WHERE c.table_name = $1
        ORDER BY c.ordinal_position;
      `;
      
      const result = await client.query(query, [args.tableName]);
      
      if (result.rows.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `Table "${args.tableName}" not found or has no columns`
          }],
          isError: true
        };
      }

      // Create a formatted table string
      let responseText = '| Column Name | Data Type | Nullable | Default | Description | Constraints |\n';
      responseText += '|-------------|-----------|----------|----------|-------------|-------------|\n';
      
      responseText += result.rows.map(col => {
        const dataType = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.numeric_precision 
            ? `${col.data_type}(${col.numeric_precision},${col.numeric_scale})`
            : col.data_type;
            
        const constraints = [];
        if (col.constraint_type === 'PRIMARY KEY') constraints.push('PRIMARY KEY');
        if (col.constraint_type === 'FOREIGN KEY') constraints.push('FOREIGN KEY');
        
        return `| ${col.column_name} | ${dataType} | ${col.is_nullable} | ${col.column_default || 'NULL'} | ${col.column_description || 'No description'} | ${constraints.join(', ') || 'None'} |`;
      }).join('\n');

      // Get table indexes
      const indexQuery = `
        SELECT
          i.relname as index_name,
          array_agg(a.attname)::text[] as column_names,
          ix.indisunique as is_unique
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = $1
        GROUP BY
          i.relname,
          ix.indisunique
        ORDER BY
          i.relname;
      `;

      const indexResult = await client.query(indexQuery, [args.tableName]);
      
      if (indexResult.rows.length > 0) {
        responseText += '\n\n### Indexes\n';
        responseText += '| Index Name | Columns | Type |\n';
        responseText += '|------------|---------|------|\n';
        
        responseText += indexResult.rows.map(idx => {
          const type = idx.is_unique ? 'UNIQUE' : 'INDEX';
          return `| ${idx.index_name} | ${idx.column_names.join(', ')} | ${type} |`;
        }).join('\n');
      }

      log.info(`Retrieved schema for table ${args.tableName}`);
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        isError: false
      };

    } catch (error) {
      const pgError = error as SqlQueryError;
      let errorMessage = 'Failed to read table schema';
      if (pgError.message) errorMessage += `: ${pgError.message}`;
      if (pgError.detail) errorMessage += `\nDetail: ${pgError.detail}`;
      if (pgError.hint) errorMessage += `\nHint: ${pgError.hint}`;
      
      log.error('Schema reading error', pgError);
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
    log.error('Error reading table schema', error);
    return {
      content: [{
        type: 'text',
        text: error instanceof Error ? error.message : 'Unknown error occurred while reading table schema'
      }],
      isError: true
    };
  }
}; 