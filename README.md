# Nile MCP Server

A Model Context Protocol (MCP) server implementation for Nile database operations. This server allows LLM applications to interact with Nile databases through a standardized interface.

## Features

- **Create Database Tool**: Create new Nile databases with specified names and regions
- **MCP Protocol Support**: Full implementation of the Model Context Protocol
- **Type Safety**: Written in TypeScript with full type checking
- **Test Coverage**: Comprehensive test suite using Jest

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

## Testing with Claude Desktop

1. Open Claude Desktop
2. Go to Settings > MCP Servers
3. Add a new server with the following configuration:

```json
{
  "name": "Nile Database",
  "description": "Create and manage Nile databases",
  "transport": {
    "type": "stdio",
    "command": "node dist/index.js"
  },
  "env": {
    "NILE_API_KEY": "your_api_key_here",
    "NILE_WORKSPACE_SLUG": "your_workspace_slug"
  }
}
```

4. Test the server by asking Claude to create a database:
```
Please create a new database named "my-test-db" in the AWS_US_WEST_2 region.
```

## Testing with Node.js Script

Create a test script (e.g., `test.mjs`):

```javascript
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start the MCP server process
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  env: {
    ...process.env,
    NILE_API_KEY: 'your_api_key_here',
    NILE_WORKSPACE_SLUG: 'your_workspace_slug'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Example function call message
const message = {
  type: 'function_call',
  function: {
    name: 'create-database',
    arguments: {
      name: 'my-test-db',
      region: 'AWS_US_WEST_2'
    }
  }
};

// Send the message to the server
serverProcess.stdin.write(JSON.stringify(message) + '\n');

// Handle server response
serverProcess.stdout.on('data', (data) => {
  console.log('Server response:', JSON.parse(data.toString()));
  serverProcess.kill(); // Clean up
});

// Handle errors
serverProcess.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
  serverProcess.kill();
});
```

Run the test script:
```bash
node test.mjs
```

## Available Tools

### create-database

Creates a new Nile database.

Parameters:
- `name` (string, required): Name of the database (must be less than 64 characters, unique within workspace)
- `region` (string, required): Region where the database should be created
  - `AWS_US_WEST_2` - AWS in US West (Oregon)
  - `AWS_EU_CENTRAL_1` - AWS in Europe (Frankfurt)

## Development

### Project Structure

```
nile-mcp-server/
├── src/
│   ├── server.ts     # MCP server implementation
│   ├── index.ts      # Entry point
│   ├── types.ts      # Type definitions
│   └── __tests__/    # Test files
├── dist/            # Compiled JavaScript
└── package.json
```

### Running Tests

```bash
npm test
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Nile Database](https://thenile.dev)
- [Claude Desktop](https://claude.ai) 