# Miro & Gong MCP Servers

A suite of Model Context Protocol (MCP) servers for collaborative intelligence:
- **Miro Template Recommender**: Analyzes meeting notes and Miro board content to suggest relevant Miro templates for workshops and collaborative sessions.
- **Gong Call Analysis Server**: Integrates with Gong to search, select, and analyze calls, providing highlights and key points for sales and customer conversations.

## Features

- **Miro Template Recommendation**
  - Analyze meeting notes or Miro board content
  - Smart template matching across multiple categories
  - Contextual, ranked recommendations
  - Weighted scoring and keyword analysis

- **Gong Call Analysis**
  - Search Gong calls by customer name and date
  - Fuzzy and exact matching for call titles
  - Select and retrieve call details, highlights, and key points
  - Useful for sales, customer success, and research teams

## Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd miro-template-recommender
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Set up API access:**
   - **Miro:**
     - Go to [Miro Developer Console](https://developers.miro.com/)
     - Create a new app and get your access token
     - Set the environment variable:
     ```bash
     export MIRO_ACCESS_TOKEN="your_access_token_here"
     ```
   - **Gong:**
     - Get your Gong API key and secret
     - Set the environment variables:
     ```bash
     export GONG_KEY="your_gong_key_here"
     export GONG_SECRET="your_gong_secret_here"
     ```

## Usage

### 1. Run the Miro Template Recommender MCP Server
```bash
npx ts-node src/miro-server.ts
```
- Provides tools for analyzing Miro boards and meeting notes, and recommending templates.

### 2. Run the Gong MCP Server
```bash
npx ts-node src/gong-server.ts
```
- Provides tools for searching, selecting, and analyzing Gong calls.

### 3. (Alternative) Run the Combined Server
```bash
npx ts-node src/index.ts
```
- (If applicable) Provides both Miro and Gong tools in a single MCP server.

## Project Structure
```
src/
├── index.ts         # Combined MCP server (Miro + Gong, if used)
├── miro-client.ts   # Miro API integration and board analysis utilities
├── miro-server.ts   # Miro Template Recommender MCP server
├── gong-server.ts   # Gong MCP server for Gong API integration
```

## API Reference

### Miro Template Recommendation Tools

#### `recommendTemplates`
Analyzes content and returns template recommendations.

**Parameters:**
- `boardId` (optional): The Miro board ID to analyze
- `meetingNotes` (optional): Meeting notes text to analyze
- `maxRecommendations` (optional): Maximum number of recommendations (default: 5)

**Returns:**
```typescript
{
  contentType: "meeting_notes" | "miro_board",
  analysis: {
    detectedKeywords: string[],
    identifiedCategories: string[],
    context: string,
    extractedContent?: string[]
  },
  recommendations: Array<{
    name: string,
    url: string,
    description: string,
    category: string,
    relevanceScore: number
  }>
}
```

#### `get_board_content`
Extract all text content from a Miro board.

**Parameters:**
- `boardId`: The Miro board ID

#### `get_board_analysis`
Get detailed analysis of board content with keywords and categories.

**Parameters:**
- `boardId`: The Miro board ID

### Miro Board Management Tools

#### Board Operations
- `create_miro_board`: Create a new Miro board
- `get_board_content`: Extract text content from board
- `get_all_items`: Get all items from board

#### Frame Management
- `create_frame`: Create a new frame with positioning
- `get_frame`: Retrieve frame details
- `update_frame`: Modify frame properties
- `delete_frame`: Remove a frame

#### Text Item Management
- `create_text`: Create text items with styling
- `get_text_item`: Retrieve text item details
- `update_text`: Modify text content and styling
- `delete_text`: Remove text items

#### Sticky Note Management
- `create_sticky`: Create sticky notes
- `get_sticky`: Retrieve sticky note details
- `update_sticky`: Modify sticky note content
- `delete_sticky`: Remove sticky notes

#### Card Management
- `create_card`: Create cards with content
- `get_card`: Retrieve card details
- `update_card`: Modify card properties
- `delete_card`: Remove cards

#### Utility Operations
- `update_item_position_or_parent`: Reposition items or change parent
- `share_board`: Share boards with team members

### Gong Call Analysis Tools

#### `search_gong_calls`
Search Gong calls by customer name and date range.

**Parameters:**
- `customerName`: Customer name to search for (fuzzy match in call title)
- `fromDate` (optional): Start date (ISO 8601)
- `toDate` (optional): End date (ISO 8601)

#### `select_gong_call`
Select a specific call from search results.

**Parameters:**
- `callId`: Direct Gong call ID to select
- `selectionNumber`: Selection number from search results
- `customerName`: Original customer name used in search (required with selectionNumber)

#### `get_gong_call_details`
Fetch highlights and key points for a Gong call.

**Parameters:**
- `callId`: The Gong call ID

## Template Categories

The system supports the following template categories with intelligent keyword matching:

### 🎯 **Workshops**
- Meeting agendas, icebreakers, team charters, design sprints
- Keywords: workshop, facilitation, collaboration, team building

### 🛠️ **Brainstorming**
- Mind maps, affinity diagrams, SCAMPER, six thinking hats
- Keywords: ideas, creativity, innovation, ideation

### 🔍 **Research**
- Customer journey maps, personas, empathy maps, competitive analysis
- Keywords: research, user research, customer insights, UX

### 📋 **Strategic Planning**
- Business model canvas, SWOT analysis, OKR planning, roadmaps
- Keywords: strategy, planning, business model, goals

### ⚡ **Agile**
- Sprint planning, retrospectives, kanban boards, user story mapping
- Keywords: sprint, scrum, agile, backlog, user stories

### 📋️ **Mapping**
- UML diagrams, flowcharts, process maps, architecture diagrams
- Keywords: mapping, diagram, flowchart, process, workflow

## Example Usage

### Template Recommendation
```typescript
// Analyze meeting notes
const result = await recommendTemplates({
  meetingNotes: "Discussed project timeline and need to plan workshop for team alignment",
  maxRecommendations: 3
});

// Analyze existing board
const boardResult = await recommendTemplates({
  boardId: "uXjVKMOJbXg=",
  maxRecommendations: 5
});
```

### Board Management
```typescript
// Create a new board
const board = await createMiroBoard({
  name: "Project Planning Workshop",
  description: "Board for our upcoming planning session"
});

// Add content to board
const frame = await createFrame({
  boardId: board.id,
  title: "Agenda",
  x: 100,
  y: 100,
  width: 400,
  height: 300
});

const text = await createText({
  boardId: board.id,
  data: { content: "1. Project Overview" },
  position: { x: 120, y: 120 },
  parentId: frame.id
});
```

### Gong Call Analysis
```typescript
// Search for calls
const searchResult = await searchGongCalls({ 
  customerName: "Acme Corp", 
  fromDate: "2024-01-01", 
  toDate: "2024-03-31" 
});

// Select and analyze a call
const selected = await selectGongCall({ 
  selectionNumber: 1, 
  customerName: "Acme Corp" 
});

const details = await getGongCallDetails({ 
  callId: selected.callId 
});
```

## Configuration

### Environment Variables
```bash
# Required for Miro functionality
MIRO_ACCESS_TOKEN=your_miro_access_token

# Required for Gong functionality
GONG_KEY=your_gong_api_key
GONG_SECRET=your_gong_api_secret
```

### Package Scripts
```bash
# Build
npm run build

# Production
npm start                    # Combined server
npm run start:miro          # Miro server only
npm run start:gong          # Gong server only

# Development
npm run dev                 # Combined with watch
npm run dev:miro           # Miro server with watch
npm run dev:gong           # Gong server with watch
```

## Extending the System

### Adding New Template Categories
1. Update the `TEMPLATE_CATEGORIES` object in `src/miro-server.ts`
2. Add new categories with:
   - Keywords for matching
   - Template definitions with URLs
   - Semantic descriptions

### Customizing Analysis
- Enhance keyword matching algorithms
- Implement semantic analysis using embeddings
- Add support for additional content types

### Adding New Miro Operations
- Extend the `MiroClient` class in `src/miro-client.ts`
- Add new tool handlers in the server files
- Implement additional board item types

## Security & Best Practices

- **API Key Management**: Store credentials securely using environment variables
- **Rate Limiting**: Built-in retry logic with exponential backoff for API calls
- **Error Handling**: Comprehensive error handling for API failures
- **Caching**: Intelligent caching for Gong API pagination results

## Limitations

- Requires valid Miro and/or Gong API credentials
- Template recommendations based on keyword matching (not AI-powered)
- Analysis limited to text content extraction
- Gong API rate limits apply

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **Miro API**: Check [Miro Developer docs](https://developers.miro.com/)
- **Gong API**: See [Gong API docs](https://developers.gong.io/)
- **This project**: Create an issue in this repository

## Version History

- **v0.1.0**: Initial release with Miro template recommendations
- **v0.2.0**: Added Gong call analysis integration
- **v0.3.0**: Enhanced board management capabilities
- **v0.3.1**: Improved positioning and parent-child relationships