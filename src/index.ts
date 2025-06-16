#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

// Enhanced template categories with meeting-specific keywords
const TEMPLATE_CATEGORIES = {
  "brainstorming": {
    keywords: [
      "ideas", "creativity", "innovation", "brainstorm", "ideation", "concepts",
      "mind map", "creative thinking", "generate ideas", "explore options",
      "think outside", "creative session", "idea generation"
    ],
    templates: [
      {
        name: "Mind Map",
        url: "https://miro.com/templates/mind-map/",
        description: "Visualize ideas and their connections"
      },
      {
        name: "Brainwriting",
        url: "https://miro.com/templates/brainwriting/",
        description: "Generate ideas individually before sharing"
      },
      {
        name: "Idea Parking Lot",
        url: "https://miro.com/templates/idea-parking-lot/",
        description: "Capture and organize random ideas"
      }
    ]
  },
  "planning": {
    keywords: [
      "plan", "roadmap", "timeline", "schedule", "strategy", "goals", "objectives",
      "milestone", "gantt", "planning session", "next steps", "action items",
      "deliverables", "due dates", "priorities", "project plan"
    ],
    templates: [
      {
        name: "Product Roadmap",
        url: "https://miro.com/templates/product-roadmap/",
        description: "Plan product development over time"
      },
      {
        name: "Project Timeline",
        url: "https://miro.com/templates/project-timeline/",
        description: "Visualize project phases and milestones"
      },
      {
        name: "OKRs Template",
        url: "https://miro.com/templates/okrs/",
        description: "Set and track objectives and key results"
      }
    ]
  },
  "agile": {
    keywords: [
      "sprint", "scrum", "agile", "retrospective", "standup", "backlog", "user stories",
      "kanban", "velocity", "story points", "sprint planning", "daily standup",
      "sprint review", "burndown", "epic", "feature", "bug", "technical debt"
    ],
    templates: [
      {
        name: "Sprint Planning",
        url: "https://miro.com/templates/sprint-planning/",
        description: "Plan your next sprint effectively"
      },
      {
        name: "Retrospective",
        url: "https://miro.com/templates/retrospective/",
        description: "Reflect on team performance and improve"
      },
      {
        name: "User Story Mapping",
        url: "https://miro.com/templates/user-story-mapping/",
        description: "Map user journeys and prioritize features"
      }
    ]
  },
  "design": {
    keywords: [
      "design", "prototype", "wireframe", "ux", "ui", "user experience", "mockup",
      "persona", "usability", "user research", "design review", "feedback",
      "design system", "visual design", "interaction design"
    ],
    templates: [
      {
        name: "Wireframe Kit",
        url: "https://miro.com/templates/wireframe-kit/",
        description: "Create low-fidelity wireframes"
      },
      {
        name: "Design System",
        url: "https://miro.com/templates/design-system/",
        description: "Document design components and guidelines"
      },
      {
        name: "User Journey Map",
        url: "https://miro.com/templates/user-journey-map/",
        description: "Visualize user interactions and pain points"
      }
    ]
  },
  "analysis": {
    keywords: [
      "analysis", "research", "data", "insights", "swot", "competitive", "market",
      "metrics", "kpi", "findings", "results", "conclusions", "recommendations",
      "pain points", "opportunities", "challenges", "risks"
    ],
    templates: [
      {
        name: "SWOT Analysis",
        url: "https://miro.com/templates/swot-analysis/",
        description: "Analyze strengths, weaknesses, opportunities, threats"
      },
      {
        name: "Competitive Analysis",
        url: "https://miro.com/templates/competitive-analysis/",
        description: "Compare competitors and market position"
      },
      {
        name: "Research Synthesis",
        url: "https://miro.com/templates/research-synthesis/",
        description: "Organize and synthesize research findings"
      }
    ]
  },
  "workshops": {
    keywords: [
      "workshop", "facilitation", "meeting", "collaboration", "team building",
      "icebreaker", "session", "attendees", "participants", "discussion",
      "facilitated", "breakout", "group exercise", "team activity"
    ],
    templates: [
      {
        name: "Icebreaker Activities",
        url: "https://miro.com/templates/icebreaker-activities/",
        description: "Energize your team and break the ice"
      },
      {
        name: "Workshop Agenda",
        url: "https://miro.com/templates/workshop-agenda/",
        description: "Structure your workshop sessions"
      },
      {
        name: "Team Charter",
        url: "https://miro.com/templates/team-charter/",
        description: "Define team purpose, roles, and working agreements"
      }
    ]
  },
  "meetings": {
    keywords: [
      "meeting", "discussion", "decisions", "follow up", "takeaways", "notes",
      "attendees", "agenda", "minutes", "summary", "next meeting", "agreed",
      "decided", "discussed", "reviewed", "presented"
    ],
    templates: [
      {
        name: "Meeting Notes Template",
        url: "https://miro.com/templates/meeting-notes/",
        description: "Capture and organize meeting discussions"
      },
      {
        name: "Decision Matrix",
        url: "https://miro.com/templates/decision-matrix/",
        description: "Evaluate options and make informed decisions"
      },
      {
        name: "Action Item Tracker",
        url: "https://miro.com/templates/action-item-tracker/",
        description: "Track follow-up tasks and ownership"
      }
    ]
  }
} as const;

type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES;

interface MiroItem {
  id: string;
  type: string;
  data: {
    content?: string;
    text?: string;
    title?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

interface MiroBoardInfo {
  id: string;
  name: string;
  description?: string;
  items: MiroItem[];
}

class MiroClient {
  private accessToken: string;
  private baseUrl = 'https://api.miro.com/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  async getBoardInfo(boardId: string): Promise<MiroBoardInfo> {
    try {
      const boardResponse = await this.makeRequest(`/boards/${boardId}`);
      const itemsResponse = await this.makeRequest(`/boards/${boardId}/items`);

      return {
        id: boardResponse.id,
        name: boardResponse.name,
        description: boardResponse.description,
        items: itemsResponse.data || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch board info: ${(error as Error).message}`);
    }
  }

  private extractTextFromItem(item: MiroItem): string | null {
    switch (item.type) {
      case 'text':
      case 'sticky_note':
        return item.data.content || item.data.text || null;
      case 'shape':
        return item.data.content || null;
      case 'card':
        return item.data.title || item.data.content || null;
      default:
        return item.data.content || item.data.text || item.data.title || null;
    }
  }

  async getBoardContent(boardId: string): Promise<string[]> {
    try {
      const boardInfo = await this.getBoardInfo(boardId);
      const content: string[] = [];

      for (const item of boardInfo.items) {
        const textContent = this.extractTextFromItem(item);
        if (textContent) {
          content.push(textContent);
        }
      }

      if (boardInfo.name) {
        content.unshift(boardInfo.name);
      }
      if (boardInfo.description) {
        content.push(boardInfo.description);
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to extract board content: ${(error as Error).message}`);
    }
  }
}

class MiroTemplateRecommenderServer {
  private server: Server;
  private miroClient?: MiroClient;

  constructor() {
    this.server = new Server({
      name: "miro-template-recommender",
      version: "0.3.0",
      capabilities: {
        tools: {},
      },
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_board_content",
          description: "Get all text content from a Miro board as an array of strings",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The Miro board ID (e.g., uXjVKMOJbXg=)"
              }
            },
            required: ["boardId"]
          }
        },
        {
          name: "get_all_items",
          description: "Get all items from a Miro board (not just text)",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The Miro board ID"
              }
            },
            required: ["boardId"]
          }
        },
        {
          name: "get_board_analysis",
          description: "Get detailed analysis of a Miro board's content and context",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The Miro board ID to analyze"
              }
            },
            required: ["boardId"]
          }
        },
        {
          name: "recommend_templates",
          description: "Recommend Miro templates based on content analysis (supports both Miro board and meeting notes)",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The Miro board ID to analyze"
              },
              meetingNotes: {
                type: "string", 
                description: "Meeting notes text to analyze"
              },
              maxRecommendations: {
                type: "number",
                description: "Maximum number of template recommendations (default: 5)",
                default: 5
              }
            },
            anyOf: [
              { required: ["boardId"] },
              { required: ["meetingNotes"] }
            ]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "get_board_content":
            return await this.getBoardContent(request.params.arguments);
          case "get_all_items":
            return await this.getAllItems(request.params.arguments);
          case "get_board_analysis":
            return await this.getBoardAnalysis(request.params.arguments);
          case "recommend_templates":
            return await this.recommendTemplates(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    });
  }

  private async getBoardContent(args: any) {
    const { boardId } = args;
    
    if (!this.miroClient) {
      const mockContent = [
        "Sprint planning for Q2 2024",
        "User story: As a customer, I want to track my order",
        "Retrospective action items",
        "Design system components"
      ];
      return {
        content: [{
          type: "text",
          text: JSON.stringify(mockContent, null, 2)
        }]
      };
    }

    const content = await this.miroClient.getBoardContent(boardId);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(content, null, 2)
      }]
    };
  }

  private async getAllItems(args: any) {
    const { boardId } = args;
    
    if (!this.miroClient) {
      const mockItems = [
        { id: "1", type: "sticky_note", data: { content: "Sprint planning for Q2 2024" }, position: { x: 0, y: 0 } },
        { id: "2", type: "text", data: { content: "User story: As a customer, I want to track my order" }, position: { x: 100, y: 100 } }
      ];
      return {
        content: [{
          type: "text",
          text: JSON.stringify(mockItems, null, 2)
        }]
      };
    }

    const boardInfo = await this.miroClient.getBoardInfo(boardId);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(boardInfo.items, null, 2)
      }]
    };
  }

  private async getBoardAnalysis(args: any) {
    const { boardId } = args;
    
    let boardContent: string[];
    if (!this.miroClient) {
      boardContent = [
        "Sprint planning for Q2 2024",
        "User story: As a customer, I want to track my order",
        "Retrospective action items"
      ];
    } else {
      boardContent = await this.miroClient.getBoardContent(boardId);
    }
    
    const analysis = this.analyzeContent(boardContent);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          boardId,
          contentSummary: {
            itemCount: boardContent.length,
            items: boardContent
          },
          analysis: {
            detectedKeywords: analysis.keywords,
            identifiedCategories: analysis.categories,
            context: analysis.context
          }
        }, null, 2)
      }]
    };
  }

  private async recommendTemplates(args: any) {
    const { boardId, meetingNotes, maxRecommendations = 5 } = args;
    
    let content: string[];
    let contentType: string;
    
    if (boardId) {
      // Analyze Miro board
      if (!this.miroClient) {
        content = [
          "Sprint planning for Q2 2024",
          "User story: As a customer, I want to track my order",
          "Retrospective action items",
          "Design system components"
        ];
      } else {
        content = await this.miroClient.getBoardContent(boardId);
      }
      contentType = "miro_board";
    } else if (meetingNotes) {
      // Analyze meeting notes
      content = this.parseMeetingNotes(meetingNotes);
      contentType = "meeting_notes";
    } else {
      throw new Error("Please provide either a Miro board ID or meeting notes text.");
    }
    
    const analysis = this.analyzeContent(content);
    const recommendations = this.generateRecommendations(analysis, maxRecommendations);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          ...(boardId && { boardId }),
          contentType,
          analysis: {
            detectedKeywords: analysis.keywords,
            identifiedCategories: analysis.categories,
            context: analysis.context,
            ...(contentType === "meeting_notes" && { extractedContent: content })
          },
          recommendations
        }, null, 2)
      }]
    };
  }

  private parseMeetingNotes(meetingNotes: string): string[] {
    const lines = meetingNotes.split('\n').filter(line => line.trim().length > 0);
    const content: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 3) return;
      
      const cleanedLine = trimmedLine
        .replace(/^[-*•]\s*/, '')
        .replace(/^\d+\.\s*/, '') 
        .replace(/^#{1,6}\s*/, '')
        .trim();
      
      if (cleanedLine.length > 0) {
        content.push(cleanedLine);
      }
    });
    
    return content;
  }

  private analyzeContent(content: string[]): {
    keywords: string[];
    categories: TemplateCategory[];
    context: string;
  } {
    const allText = content.join(" ").toLowerCase();
    const foundKeywords: string[] = [];
    const categoryScores: { [key: string]: number } = {};

    for (const [category, categoryData] of Object.entries(TEMPLATE_CATEGORIES)) {
      const categoryKeywords: readonly string[] = TEMPLATE_CATEGORIES[category as TemplateCategory]?.keywords ?? [];
      const matchingKeywords = categoryKeywords.filter(keyword => 
        allText.includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        foundKeywords.push(...matchingKeywords);
        categoryScores[category] = matchingKeywords.length;
      }
    }

    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category as TemplateCategory);

    const context = this.generateContextDescription(sortedCategories);

    return {
      keywords: [...new Set(foundKeywords)],
      categories: sortedCategories,
      context
    };
  }

  private generateRecommendations(
    analysis: { keywords: string[]; categories: TemplateCategory[]; context: string },
    maxRecommendations: number
  ) {
    const recommendations: any[] = [];
    
    for (const category of analysis.categories) {
      const categoryTemplates = TEMPLATE_CATEGORIES[category]?.templates || [];
      recommendations.push(...categoryTemplates.map((template: any) => ({
        ...template,
        category,
        relevanceScore: this.calculateRelevanceScore(analysis.keywords, category)
      })));
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxRecommendations)
      .map(rec => ({
        name: rec.name,
        url: rec.url,
        link: `[${rec.name}](${rec.url})`,
        description: rec.description,
        category: rec.category,
        relevanceScore: rec.relevanceScore
      }));
  }

  private generateContextDescription(categories: TemplateCategory[]): string {
    const contextMap: { [key: string]: string } = {
      "agile": "Agile/Scrum methodology",
      "design": "Design and UX work", 
      "planning": "Strategic planning",
      "brainstorming": "Ideation and creativity",
      "analysis": "Research and analysis",
      "workshops": "Team collaboration and workshops",
      "meetings": "Meeting management and follow-up"
    };

    const contexts = categories.slice(0, 3).map(cat => contextMap[cat]).filter(Boolean);
    
    return contexts.length > 0 
      ? `Content appears to focus on: ${contexts.join(", ")}`
      : "General collaborative work";
  }

  private calculateRelevanceScore(keywords: string[], category: TemplateCategory): number {
    const categoryKeywords: readonly string[] = TEMPLATE_CATEGORIES[category]?.keywords ?? [];
    const matches = keywords.filter((k) => categoryKeywords.includes(k)).length;
    return matches / categoryKeywords.length;
  }

  async run() {
    const accessToken = process.env.MIRO_ACCESS_TOKEN;
    if (accessToken) {
      this.miroClient = new MiroClient(accessToken);
      console.error("Miro API integration enabled");
    } else {
      console.error("No Miro access token found, using mock data");
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Enhanced Miro Template Recommender MCP server running on stdio");
  }
}

const server = new MiroTemplateRecommenderServer();
server.run().catch(console.error);