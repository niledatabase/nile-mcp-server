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
```

## Configuration

Create a `.env` file in the root directory with your Nile API key:

```env
NILE_API_KEY=your_api_key_here
```

## Usage

### Starting the Server

```bash
# Build the project
npm run build

# Start the server
npm start your_nile_api_key
```

### Using with Claude Desktop

1. Open Claude Desktop
2. Go to Settings > MCP Servers
3. Add a new server with the following configuration:

```json
{
  "name": "Nile Database",
  "transport": {
    "type": "stdio",
    "command": "npm start your_nile_api_key"
  }
}
```

### Available Tools

#### create-database

Creates a new Nile database.

Parameters:
- `name` (string, required): Name of the database
- `region` (string, required): Region where the database should be created

Example usage in Claude:

```
Please create a new database named "my-app" in the us-east-1 region using the create-database tool.
```

## Development

### Project Structure

```
nile-mcp-server/
├── src/
│   ├── server.ts       # Main server implementation
│   ├── index.ts        # Entry point
│   └── __tests__/      # Test files
├── dist/              # Compiled JavaScript
├── package.json
└── tsconfig.json
```

### Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Building

```bash
# Build the project
npm run build
```

## Technical Details

### Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Runtime type checking and validation
- `typescript`: Type safety and compilation
- `jest` and `ts-jest`: Testing framework

### Type Safety

The server uses TypeScript and Zod for comprehensive type safety:
- Compile-time type checking with TypeScript
- Runtime validation of tool parameters with Zod schemas
- Type-safe responses using the MCP protocol

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Nile Database](https://thenile.dev)
- [Claude Desktop](https://claude.ai) 