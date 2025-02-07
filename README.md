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

### Usage

Once configured, you can interact with the Nile database directly in Claude Desktop. Here are some example commands:

1. Create a new database:
   ```
   Please create a new database named "my-app-db" in the AWS_US_WEST_2 region.
   ```

2. Check available regions:
   ```
   What regions are available for creating a Nile database?
   ```

Available regions:
- `AWS_US_WEST_2` - US West (Oregon)
- `AWS_EU_CENTRAL_1` - Europe (Frankfurt)

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
- [Claude Desktop](https://claude.ai/desktop) 