# Miro Template Recommender

An intelligent template recommendation system that analyzes meeting notes and Miro board content to suggest relevant Miro templates for workshops and collaborative sessions.

## Features

- **Meeting Notes Analysis**: Analyzes meeting notes to understand context and requirements
- **Smart Template Matching**: Matches content with relevant Miro templates across multiple categories
- **Contextual Recommendations**: Provides template suggestions based on meeting objectives and content
- **Multiple Input Types**: Supports both Miro board content and meeting notes analysis
- **Weighted Scoring**: Ranks recommendations based on relevance and context

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

3. **Set up Miro API access:**
   - Go to [Miro Developer Console](https://developers.miro.com/)
   - Create a new app
   - Get your access token
   - Set the environment variable:
   ```bash
   export MIRO_ACCESS_TOKEN="your_access_token_here"
   ```

## Usage

### 1. Get Template Recommendations from Meeting Notes

```typescript
const recommendations = await recommendTemplates({
  meetingNotes: "Your meeting notes here...",
  maxRecommendations: 5
});
```

This will:
- Parse and analyze meeting notes
- Identify key themes and objectives
- Return ranked template recommendations

### 2. Get Template Recommendations from Miro Board

```typescript
const recommendations = await recommendTemplates({
  boardId: "your-board-id",
  maxRecommendations: 5
});
```

This will:
- Extract content from the Miro board
- Analyze board context and purpose
- Return relevant template suggestions

## Supported Template Categories

The system recognizes and recommends templates for:

- **Workshops**: 
  - Workshop Agenda
  - Icebreaker Activities
  - Team Charter

- **Planning**: 
  - Product Roadmap
  - Project Timeline
  - OKRs Template

- **Collaboration**: 
  - Mind Map
  - Brainwriting
  - Idea Parking Lot

- **Analysis**: 
  - SWOT Analysis
  - Research Synthesis
  - Decision Matrix

- **Agile**: 
  - Sprint Planning
  - Retrospective
  - User Story Mapping

- **Design**: 
  - Wireframe Kit
  - Design System
  - User Journey Map

## API Reference

### `recommendTemplates`

Analyzes content and returns template recommendations.

**Parameters:**
- `boardId` (optional): The Miro board ID
- `meetingNotes` (optional): Meeting notes text to analyze
- `maxRecommendations` (optional): Maximum number of recommendations (default: 5)

**Note:** Either `boardId` or `meetingNotes` must be provided.

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

## Example Usage

```typescript
// Example with meeting notes
const result = await recommendTemplates({
  meetingNotes: `
    Meeting Recap:
    - Discussed project timeline
    - Need to plan workshop
    - Team collaboration required
  `,
  maxRecommendations: 3
});

// Example output
{
  "contentType": "meeting_notes",
  "analysis": {
    "detectedKeywords": ["project", "timeline", "workshop", "collaboration"],
    "identifiedCategories": ["planning", "workshops"],
    "context": "Content appears to focus on: Strategic planning, Team collaboration and workshops"
  },
  "recommendations": [
    {
      "name": "Workshop Agenda",
      "url": "https://miro.com/templates/workshop-agenda/",
      "description": "Structure your workshop sessions",
      "category": "workshops",
      "relevanceScore": 0.9
    },
    {
      "name": "Project Timeline",
      "url": "https://miro.com/templates/project-timeline/",
      "description": "Visualize project phases and milestones",
      "category": "planning",
      "relevanceScore": 0.85
    }
  ]
}
```

## Development

### Project Structure
```
src/
├── index.ts              # Main server implementation
├── miro-client.ts        # Miro API integration
└── template-engine.ts    # Template recommendation logic
```

### Running in Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

## Extending the System

### Adding New Template Categories

1. Update the `TEMPLATE_CATEGORIES` object in `index.ts`
2. Add new categories with:
   - Keywords for matching
   - Template definitions
   - Category weight for scoring

### Customizing Analysis

The content analysis can be enhanced by:
- Adding more sophisticated keyword matching
- Implementing semantic analysis
- Supporting additional content types

## Security

- Store Miro access tokens securely using environment variables
- Implement proper error handling for API calls
- Consider rate limiting for API requests

## Limitations

- Requires Miro API access for board analysis
- Template recommendations are based on predefined categories and keywords
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
- **This project**: Create an issue in this repository