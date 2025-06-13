# Miro Template Recommender MCP Server

An MCP (Model Context Protocol) server that analyzes Miro board content and recommends relevant Miro templates based on the context and content found in your boards.

## Features

- **Content Analysis**: Extracts and analyzes text content from Miro boards
- **Smart Categorization**: Identifies board purposes (agile, design, planning, etc.)
- **Template Recommendations**: Suggests relevant Miro templates based on content
- **Relevance Scoring**: Ranks recommendations by relevance to board content
- **Multiple Tools**: Provides both analysis and recommendation capabilities

## Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd miro-template-recommender-mcp
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Set up Miro API access:**
   - Go to [Miro Developer Console](https://developers.miro.com/)
   - Create a new app
   - Get your access token
   - Set the environment variable:
   ```bash
   export MIRO_ACCESS_TOKEN="your_access_token_here"
   ```

## Configuration

Add the MCP server to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "miro-template-recommender": {
      "command": "node",
      "args": ["path/to/miro-template-recommender-mcp/build/index.js"],
      "env": {
        "MIRO_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

## Usage

### 1. Get Template Recommendations

```
Can you recommend Miro templates for board ID "uXjVKMOJbXg="?
```

This will:
- Analyze the board content
- Identify relevant categories
- Return ranked template recommendations

### 2. Analyze Board Content

```
Please analyze the content of Miro board "uXjVKMOJbXg=" and tell me what it's about.
```

This will:
- Extract all text content from the board
- Identify keywords and themes
- Provide context about the board's purpose

## Supported Template Categories

The server recognizes and recommends templates for:

- **Brainstorming**: Mind maps, brainwriting, idea parking lots
- **Planning**: Product roadmaps, project timelines, OKRs
- **Agile**: Sprint planning, retrospectives, user story mapping
- **Design**: Wireframes, design systems, user journey maps
- **Analysis**: SWOT analysis, competitive analysis, research synthesis
- **Workshops**: Icebreakers, workshop agendas, team charters

## API Reference

### Tools Available

#### `recommend_miro_templates`
Analyzes a Miro board and returns template recommendations.

**Parameters:**
- `boardId` (required): The Miro board ID
- `maxRecommendations` (optional): Maximum number of recommendations (default: 5)

**Returns:**
- Board analysis (keywords, categories, context)
- Ranked template recommendations with URLs and descriptions

#### `get_board_analysis`
Provides detailed analysis of a Miro board's content.

**Parameters:**
- `boardId` (required): The Miro board ID

**Returns:**
- Content summary
- Detected keywords and categories
- Board context description

## Example Output

```json
{
  "boardId": "uXjVKMOJbXg=",
  "analysis": {
    "detectedKeywords": ["sprint", "retrospective", "user stories", "backlog"],
    "identifiedCategories": ["agile"],
    "context": "Board appears to focus on: Agile/Scrum methodology"
  },
  "recommendations": [
    {
      "name": "Sprint Planning",
      "url": "https://miro.com/templates/sprint-planning/",
      "description": "Plan your next sprint effectively",
      "category": "agile",
      "relevanceScore": 0.85
    },
    {
      "name": "Retrospective",
      "url": "https://miro.com/templates/retrospective/",
      "description": "Reflect on team performance and improve",
      "category": "agile",
      "relevanceScore": 0.75
    }
  ]
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Project Structure
```
src/
├── index.ts              # Main MCP server
├── miro-client.ts        # Miro API integration
└── template-categories.ts # Template definitions
```

## Extending the Server

### Adding New Template Categories

1. Edit the `TEMPLATE_CATEGORIES` object in `index.ts`
2. Add keywords and template definitions
3. Rebuild the project

### Customizing Analysis Logic

The content analysis can be enhanced by:
- Adding more sophisticated NLP
- Implementing machine learning models
- Adding support for more Miro item types

## Authentication & Security

- Store your Miro access token securely
- Use environment variables, not hardcoded values
- Consider implementing token refresh logic for production use

## Limitations

- Requires Miro API access token
- Template recommendations are based on predefined categories
- Analysis is keyword-based (not semantic)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **MCP Protocol**: Check [MCP documentation](https://modelcontextprotocol.io/)
- **Miro API**: Check [Miro Developer docs](https://developers.miro.com/)
- **This server**: Create an issue in this repository