# Nile MCP Server

A Model Context Protocol (MCP) server implementation for Nile database operations. This server allows LLM applications to interact with Nile databases through a standardized interface.

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

```bash
# Clone the repository
git clone https://github.com/yourusername/nile-mcp-server.git
cd nile-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with your Nile credentials:

```env
NILE_API_KEY=your_api_key_here
NILE_WORKSPACE_SLUG=your_workspace_slug
```

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
     - `credentialId` (string, optional): Specific credential ID to use for the connection
   - Returns: Query results in a formatted table with column headers and row count
   - Features:
     - Automatic credential management (creates new if not specified)
     - Secure SSL connection to database
     - Results formatted as markdown tables
     - Detailed error messages with hints
   - Example: "Execute SELECT * FROM users LIMIT 5 on database 'my-app'"

### Example Usage

Here are some example commands you can use in Claude Desktop:

```
# Database Management
Please create a new database named "my-app" in the AWS_US_WEST_2 region.
Can you list all my databases?
Get the details for database "my-app".
Delete the database named "test-db".

# Credential Management
List all credentials for database "my-app".
Create new credentials for database "my-app".

# Region Information
What regions are available for creating databases?

# SQL Queries
Execute SELECT * FROM users LIMIT 5 on database "my-app"
Run this query on my-app database: SELECT COUNT(*) FROM orders WHERE status = 'completed'
Using credential abc-123, execute this query on my-app: SELECT * FROM products WHERE price > 100
```

### Response Format

All tools return responses in a standardized format:
- Success responses include relevant data and confirmation messages
- Error responses include detailed error messages and HTTP status codes
- All responses are formatted for easy reading in Claude Desktop

### Error Handling

The server handles various error scenarios:
- Invalid API credentials
- Network connectivity issues
- Invalid database names or regions
- Missing required parameters
- Database operation failures
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
│   ├── server.ts     # MCP server implementation
│   ├── tools.ts      # Tool implementations
│   ├── types.ts      # Type definitions
│   ├── index.ts      # Entry point
│   └── __tests__/    # Test files
├── dist/            # Compiled JavaScript
└── package.json
```

### Running Tests

```bash
npm test
```

### Type Definitions

The project includes TypeScript interfaces for:
- Database operations
- Credential management
- Error handling
- Tool responses

## License

MIT License - See [LICENSE](LICENSE) for details.

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Nile Database](https://thenile.dev)
- [Claude Desktop](https://claude.ai/desktop) 