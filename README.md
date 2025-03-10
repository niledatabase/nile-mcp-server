<p align="center">
 <a href="https://thenile.dev" target="_blank"><img width="96px" src="https://www.thenile.dev/about-logo.png" /></a>
 <h2 align="center">Nile MCP Server
  <br/>
  <img src="https://img.shields.io/npm/v/@niledatabase/server"/>
 </h2>
 <p align="center">
  <a href="https://thenile.dev/docs/ai-embeddings/nile-mcp-server"><strong>Learn more ↗️</strong></a>
  <br />
  <br />
  <a href="https://discord.gg/akRKRPKA">Discord</a>
  🔵
  <a href="https://thenile.dev">Website</a>
  🔵 
  <a href="https://github.com/orgs/niledatabase/discussions">Issues</a>
 </p>
</p>

[![smithery badge](https://smithery.ai/badge/@niledatabase/nile-mcp-server)](https://smithery.ai/server/@niledatabase/nile-mcp-server)

A Model Context Protocol (MCP) server implementation for Nile database platform. This server allows LLM applications to interact with Nile platform through a standardized interface.

## Features

- **Database Management**: Create, list, get details, and delete databases
- **Credential Management**: Create and list database credentials
- **Region Management**: List available regions for database creation
- **SQL Query Support**: Execute SQL queries directly on Nile databases
- **MCP Protocol Support**: Full implementation of the Model Context Protocol
- **Type Safety**: Written in TypeScript with full type checking
- **Error Handling**: Comprehensive error handling and user-friendly error messages
- **Test Coverage**: Comprehensive test suite using Jest
- **Environment Management**: Automatic loading of environment variables from .env file
- **Input Validation**: Schema-based input validation using Zod

## Installation

Install the stable version:
```bash
npm install @niledatabase/nile-mcp-server
```

For the latest alpha/preview version:
```bash
npm install @niledatabase/nile-mcp-server@alpha
```
This will install @niledatabase/nile-mcp-server in your node_modules folder. For example: node_modules/@niledatabase/nile-mcp-server/dist/

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/nile-mcp-server.git
cd nile-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Starting the Server

There are several ways to start the server:

1. **Direct Node Execution**:
   ```bash
   node dist/index.js
   ```
2. **Development Mode** (with auto-rebuild):
   ```bash
   npm run dev
   ```

The server will start and listen for MCP protocol messages. You should see startup logs indicating:
- Environment variables loaded
- Server instance created
- Tools initialized
- Transport connection established

To stop the server, press `Ctrl+C`.

### Verifying the Server is Running

When the server starts successfully, you should see logs similar to:
```
[info] Starting Nile MCP Server...
[info] Loading environment variables...
[info] Environment variables loaded successfully
[info] Creating server instance...
[info] Tools initialized successfully
[info] Setting up stdio transport...
[info] Server started successfully
```

If you see these logs, the server is ready to accept commands from Claude Desktop.

## Configuration

Create a `.env` file in the root directory with your Nile credentials:

```env
NILE_API_KEY=your_api_key_here
NILE_WORKSPACE_SLUG=your_workspace_slug
```

To create a Nile API key, log in to your [Nile account](console.thenile.dev), click Workspaces in the top-left, select your workspace, and navigate to the Security section in the left menu.

## Using with Claude Desktop

### Setup

1. Install [Claude Desktop](https://claude.ai/desktop) if you haven't already
2. Build the project:
   ```bash
   npm run build
   ```
3. Open Claude Desktop
4. Go to Settings > MCP Servers
5. Click "Add Server"
6. Add the following configuration:

```json
{
  "mcpServers": {
    "nile-database": {
      "command": "node",
      "args": [
        "/path/to/your/nile-mcp-server/dist/index.js"
      ],
      "env": {
        "NILE_API_KEY": "your_api_key_here",
        "NILE_WORKSPACE_SLUG": "your_workspace_slug"
      }
    }
  }
}
```

Replace:
- `/path/to/your/nile-mcp-server` with the absolute path to your project directory
- `your_api_key_here` with your Nile API key
- `your_workspace_slug` with your Nile workspace slug

## Using with Cursor

### Setup

1. Install [Cursor](https://cursor.sh) if you haven't already
2. Build the project:
   ```bash
   npm run build
   ```
3. Open Cursor
4. Go to Settings (⌘,) > Features > MCP Servers
5. Click "Add New MCP Server"
6. Configure the server:
   - Name: `nile-database` (or any name you prefer)
   - Command: 
     ```bash
     env NILE_API_KEY=your_key NILE_WORKSPACE_SLUG=your_workspace node /absolute/path/to/nile-mcp-server/dist/index.js
     ```
     Replace:
     - `your_key` with your Nile API key
     - `your_workspace` with your Nile workspace slug
     - `/absolute/path/to` with the actual path to your project
7. Click "Save"
8. You should see a green indicator showing that the MCP server is connected
9. Restart Cursor for the changes to take effect

### Server Modes

The server supports two operational modes:

#### STDIO Mode (Default)
The default mode uses standard input/output for communication, making it compatible with Claude Desktop and Cursor integrations.

#### SSE Mode
Server-Sent Events (SSE) mode enables real-time, event-driven communication over HTTP.

To enable SSE mode:
1. Set `MCP_SERVER_MODE=sse` in your `.env` file
2. The server will start an HTTP server (default port 3000)
3. Connect to the SSE endpoint: `http://localhost:3000/sse`
4. Send commands to: `http://localhost:3000/messages`

Example SSE usage with curl:
```bash
# In terminal 1 - Listen for events
curl -N http://localhost:3000/sse

# In terminal 2 - Send commands
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "type": "function",
    "name": "list-databases",
    "parameters": {}
  }'
```

### Example Prompts

After setting up the MCP server in Cursor, you can use natural language to interact with Nile databases. Here are some example prompts:

#### Database Management
```
Create a new database named "my_app" in AWS_US_WEST_2 region

List all my databases

Get details for database "my_app"

Delete database "test_db"
```

#### Creating Tables
```
Create a users table in my_app database with columns:
- tenant_id (UUID, references tenants)
- id (INTEGER)
- email (VARCHAR, unique per tenant)
- name (VARCHAR)
- created_at (TIMESTAMP)

Create a products table in my_app database with columns:
- tenant_id (UUID, references tenants)
- id (INTEGER)
- name (VARCHAR)
- price (DECIMAL)
- description (TEXT)
- created_at (TIMESTAMP)
```

#### Querying Data
```
Execute this query on my_app database:
SELECT * FROM users WHERE tenant_id = 'your-tenant-id' LIMIT 5

Run this query on my_app:
INSERT INTO users (tenant_id, id, email, name) 
VALUES ('tenant-id', 1, 'user@example.com', 'John Doe')

Show me all products in my_app database with price > 100
```

#### Schema Management
```
Show me the schema for the users table in my_app database

Add a new column 'status' to the users table in my_app database

Create an index on the email column of the users table in my_app
```

### Available Tools

The server provides the following tools for interacting with Nile databases:

#### Database Management

1. **create-database**
   - Creates a new Nile database
   - Parameters:
     - `name` (string): Name of the database
     - `region` (string): Either `AWS_US_WEST_2` (Oregon) or `AWS_EU_CENTRAL_1` (Frankfurt)
   - Returns: Database details including ID, name, region, and status
   - Example: "Create a database named 'my-app' in AWS_US_WEST_2"

2. **list-databases**
   - Lists all databases in your workspace
   - No parameters required
   - Returns: List of databases with their IDs, names, regions, and status
   - Example: "List all my databases"

3. **get-database**
   - Gets detailed information about a specific database
   - Parameters:
     - `name` (string): Name of the database
   - Returns: Detailed database information including API host and DB host
   - Example: "Get details for database 'my-app'"

4. **delete-database**
   - Deletes a database
   - Parameters:
     - `name` (string): Name of the database to delete
   - Returns: Confirmation message
   - Example: "Delete database 'my-app'"

#### Credential Management

1. **list-credentials**
   - Lists all credentials for a database
   - Parameters:
     - `databaseName` (string): Name of the database
   - Returns: List of credentials with IDs, usernames, and creation dates
   - Example: "List credentials for database 'my-app'"

2. **create-credential**
   - Creates new credentials for a database
   - Parameters:
     - `databaseName` (string): Name of the database
   - Returns: New credential details including username and one-time password
   - Example: "Create new credentials for database 'my-app'"
   - Note: Save the password when it's displayed, as it won't be shown again

#### Region Management

1. **list-regions**
   - Lists all available regions for creating databases
   - No parameters required
   - Returns: List of available AWS regions
   - Example: "What regions are available for creating databases?"

#### SQL Query Execution

1. **execute-sql**
   - Executes SQL queries on a Nile database
   - Parameters:
     - `databaseName` (string): Name of the database to query
     - `query` (string): SQL query to execute
     - `connectionString` (string, optional): Pre-existing connection string to use for the query
   - Returns: Query results formatted as a markdown table with column headers and row count
   - Features:
     - Automatic credential management (creates new if not specified)
     - Secure SSL connection to database
     - Results formatted as markdown tables
     - Detailed error messages with hints
     - Support for using existing connection strings
   - Example: "Execute SELECT * FROM users LIMIT 5 on database 'my-app'"

#### Resource Management

1. **read-resource**
   - Reads schema information for database resources (tables, views, etc.)
   - Parameters:
     - `databaseName` (string): Name of the database
     - `resourceName` (string): Name of the resource (table/view)
   - Returns: Detailed schema information including:
     - Column names and types
     - Primary keys and indexes
     - Foreign key relationships
     - Column descriptions and constraints
   - Example: "Show me the schema for the users table in my-app"

2. **list-resources**
   - Lists all resources (tables, views) in a database
   - Parameters:
     - `databaseName` (string): Name of the database
   - Returns: List of all resources with their types
   - Example: "List all tables in my-app database"

#### Tenant Management

1. **list-tenants**
   - Lists all tenants in a database
   - Parameters:
     - `databaseName` (string): Name of the database
   - Returns: List of tenants with their IDs and metadata
   - Example: "Show all tenants in my-app database"

2. **create-tenant**
   - Creates a new tenant in a database
   - Parameters:
     - `databaseName` (string): Name of the database
     - `tenantName` (string): Name for the new tenant
   - Returns: New tenant details including ID
   - Example: "Create a tenant named 'acme-corp' in my-app"

3. **delete-tenant**
   - Deletes tenants in the database
   - Parameters:
     - `databaseName` (string): Name of the database
     - `tenantName` (string): Name for the tenant
   - Returns: Success if the tenant is deleted
   - Example: "Delete tenant named 'acme-corp' in my-app"

### Example Usage

Here are some example commands you can use in Claude Desktop:

```
# Database Management
Please create a new database named "my-app" in the AWS_US_WEST_2 region.
Can you list all my databases?
Get the details for database "my-app".
Delete the database named "test-db".

# Connection String Management
Get a connection string for database "my-app".
# Connection string format: postgres://<user>:<password>@<region>.db.thenile.dev:5432/<database>
# Example: postgres://cred-123:password@us-west-2.db.thenile.dev:5432/my-app

# SQL Queries
Execute SELECT * FROM users LIMIT 5 on database "my-app"
Run this query on my-app database: SELECT COUNT(*) FROM orders WHERE status = 'completed'
Using connection string "postgres://user:pass@host:5432/db", execute this query on my-app: SELECT * FROM products WHERE price > 100
```

### Response Format

All tools return responses in a standardized format:
- Success responses include relevant data and confirmation messages
- Error responses include detailed error messages and HTTP status codes
- SQL query results are formatted as markdown tables
- All responses are formatted for easy reading in Claude Desktop

### Error Handling

The server handles various error scenarios:
- Invalid API credentials
- Network connectivity issues
- Invalid database names or regions
- Missing required parameters
- Database operation failures
- SQL syntax errors with helpful hints
- Rate limiting and API restrictions

### Troubleshooting

1. If Claude says it can't access the tools:
   - Check that the server path in the configuration is correct
   - Ensure the project is built (`npm run build`)
   - Verify your API key and workspace slug are correct
   - Restart Claude Desktop

2. If database creation fails:
   - Check your API key permissions
   - Ensure the database name is unique in your workspace
   - Verify the region is one of the supported options

3. If credential operations fail:
   - Verify the database exists and is in the READY state
   - Check that your API key has the necessary permissions

## Development

### Project Structure

```
nile-mcp-server/
├── src/
│   ├── server.ts      # MCP server implementation
│   ├── tools.ts       # Tool implementations
│   ├── types.ts       # Type definitions
│   ├── logger.ts      # Logging utilities
│   ├── index.ts       # Entry point
│   └── __tests__/     # Test files
│       └── server.test.ts
├── dist/             # Compiled JavaScript
├── logs/            # Log files directory
├── .env             # Environment configuration
├── .gitignore       # Git ignore file
├── package.json     # Project dependencies
└── tsconfig.json    # TypeScript configuration
```

### Key Files

- `server.ts`: Main server implementation with tool registration and transport handling
- `tools.ts`: Implementation of all database operations and SQL query execution
- `types.ts`: TypeScript interfaces for database operations and responses
- `logger.ts`: Structured logging with daily rotation and debug support
- `index.ts`: Server startup and environment configuration
- `server.test.ts`: Comprehensive test suite for all functionality

### Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server in production mode
node dist/index.js

# Start the server using npm script
npm start

# Start in development mode with auto-rebuild
npm run dev

# Run tests
npm test
```

### Development Scripts

The following npm scripts are available:
- `npm run build`: Compiles TypeScript to JavaScript
- `npm start`: Starts the server in production mode
- `npm run dev`: Starts the server in development mode with auto-rebuild
- `npm test`: Runs the test suite
- `npm run lint`: Runs ESLint for code quality checking
- `npm run clean`: Removes build artifacts

### Testing

The project includes a comprehensive test suite that covers:
- Tool registration and schema validation
- Database management operations
- Connection string generation
- SQL query execution and error handling
- Response formatting and error cases

Run the tests with:
```bash
npm test
```

### Logging

The server uses structured logging with the following features:
- Daily rotating log files
- Separate debug logs
- JSON formatted logs with timestamps
- Console output for development
- Log categories: info, error, debug, api, sql, startup

## License

MIT License - See [LICENSE](LICENSE) for details.

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Nile Database](https://thenile.dev)
- [Claude Desktop](https://claude.ai/desktop)
- [Cursor](https://cursor.sh) 
