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

### Miro Template Recommender Tools

#### `recommendTemplates`
Analyzes content and returns template recommendations.

**Parameters:**
- `boardId` (optional): The Miro board ID
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

#### Example Usage
```typescript
const result = await recommendTemplates({
  meetingNotes: "Discussed project timeline and need to plan workshop",
  maxRecommendations: 3
});
```

### Gong Call Analysis Tools

#### `search_gong_calls`
Search Gong calls by customer name and date range.

**Parameters:**
- `customerName`: Customer name to search for (fuzzy match in call title)
- `fromDate` (optional): Start date (ISO 8601)
- `toDate` (optional): End date (ISO 8601)

#### `select_gong_call`
Select a specific call from search results by selection number or call ID.

**Parameters:**
- `callId`: Direct Gong call ID to select
- `selectionNumber`: Selection number from search results
- `customerName`: Original customer name used in search (required with selectionNumber)

#### `get_gong_call_details`
Fetch highlights and key points for a Gong call by callId.

**Parameters:**
- `callId`: The Gong call ID

#### Example Usage
```typescript
// Search for calls
const searchResult = await search_gong_calls({ customerName: "Acme Corp", fromDate: "2024-01-01", toDate: "2024-03-31" });

// Select a call
const selected = await select_gong_call({ selectionNumber: 1, customerName: "Acme Corp" });

// Get call details
const details = await get_gong_call_details({ callId: selected.callId });
```

## Extending the System

### Adding New Template Categories (Miro)
1. Update the `TEMPLATE_CATEGORIES` object in either `index.ts` or `miro-server.ts` (depending on which server you use)
2. Add new categories with:
   - Keywords for matching
   - Template definitions
   - Category weight for scoring (if applicable)

### Customizing Analysis
- Add more sophisticated keyword matching (in `index.ts`, `miro-server.ts`, or `miro-client.ts`)
- Implement semantic analysis
- Support additional content types

### Adding/Customizing Gong Tools
- Update or extend tool handlers in `gong-server.ts` or `index.ts`
- Add new Gong API endpoints or analysis logic as needed

## Security
- Store API keys and tokens securely using environment variables
- Implement proper error handling for API calls
- Consider rate limiting for API requests

## Limitations
- Requires Miro and/or Gong API access for full functionality
- Recommendations and analysis are based on predefined categories and keywords
- Analysis is primarily keyword-based

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
- **Miro API**: Check [Miro Developer docs](https://developers.miro.com/)
- **Gong API**: See [Gong API docs](https://developers.gong.io/)
- **This project**: Create an issue in this repository