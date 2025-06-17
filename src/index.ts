#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Enhanced template categories with meeting-specific keywords
const TEMPLATE_CATEGORIES = {
  "workshops": {
    keywords: [
      "workshop", "facilitation", "meeting", "collaboration", "team building",
      "icebreaker", "session", "attendees", "participants", "discussion",
      "facilitated", "breakout", "group exercise", "team activity"
    ],
    semanticDescription: "Activities and structures for facilitating group sessions, team building, and collaborative work",
    templates: [
      {
        name: "Workshop Agenda",
        url: "https://miro.com/templates/workshop-agenda/",
        description: "Structure your workshop sessions effectively"
      },
      {
        name: "Icebreaker Activities",
        url: "https://miro.com/templates/icebreaker-activities/",
        description: "Energize your team and break the ice"
      },
      {
        name: "Team Charter",
        url: "https://miro.com/templates/team-charter/",
        description: "Define team purpose, roles, and working agreements"
      },
      {
        name: "Event Planning",
        url: "https://miro.com/templates/event-planning/",
        description: "Plan and organize events with a visual checklist"
      },
      {
        name: "Team Meeting Agenda",
        url: "https://miro.com/templates/team-meeting-agenda/",
        description: "Structure team meetings with clear goals and action items"
      },
      {
        name: "One-on-one Meeting",
        url: "https://miro.com/templates/one-on-one-meeting/",
        description: "Structure productive one-on-one meetings"
      },
      {
        name: "Parking Lot Matrix",
        url: "https://miro.com/templates/parking-lot-matrix/",
        description: "Organize and prioritize ideas during meetings"
      },
      {
        name: "Design Sprint",
        url: "https://miro.com/templates/design-sprint/",
        description: "Run a 5-day design sprint workshop"
      },
      {
        name: "Remote Workshop",
        url: "https://miro.com/templates/remote-workshop/",
        description: "Facilitate effective remote workshops"
      },
      {
        name: "Team Building",
        url: "https://miro.com/templates/team-building/",
        description: "Strengthen team relationships and collaboration"
      }
    ]
  },
  "brainstorming": {
    keywords: [
      "ideas", "creativity", "innovation", "brainstorm", "ideation", "concepts",
      "mind map", "creative thinking", "generate ideas", "explore options",
      "think outside", "creative session", "idea generation"
    ],
    semanticDescription: "Tools and frameworks for generating, organizing, and developing creative ideas",
    templates: [
      {
        name: "Mind Map",
        url: "https://miro.com/templates/mind-map/",
        description: "Visualize ideas and their connections"
      },
      {
        name: "Affinity Diagram",
        url: "https://miro.com/templates/affinity-diagram/",
        description: "Organize and consolidate information from brainstorming sessions"
      },
      {
        name: "Idea Parking Lot",
        url: "https://miro.com/templates/idea-parking-lot/",
        description: "Capture and organize random ideas"
      },
      {
        name: "Fishbone Diagram",
        url: "https://miro.com/templates/fishbone-diagram/",
        description: "Identify root causes of problems"
      },
      {
        name: "Likert Scale",
        url: "https://miro.com/templates/likert-scale/",
        description: "Measure subjective data and gather feedback"
      },
      {
        name: "Brainwriting",
        url: "https://miro.com/templates/brainwriting/",
        description: "Generate ideas individually before sharing"
      },
      {
        name: "SCAMPER",
        url: "https://miro.com/templates/scamper/",
        description: "Use SCAMPER technique for creative thinking"
      },
      {
        name: "Six Thinking Hats",
        url: "https://miro.com/templates/six-thinking-hats/",
        description: "Explore different perspectives in problem-solving"
      },
      {
        name: "Random Word",
        url: "https://miro.com/templates/random-word/",
        description: "Use random words to spark new ideas"
      },
      {
        name: "Reverse Brainstorming",
        url: "https://miro.com/templates/reverse-brainstorming/",
        description: "Solve problems by thinking in reverse"
      }
    ]
  },
  "research": {
    keywords: [
      "research", "user research", "market research", "customer insights",
      "user experience", "ux", "design research", "user testing",
      "customer journey", "persona", "user feedback"
    ],
    semanticDescription: "Tools for conducting and organizing user research, market analysis, and design research",
    templates: [
      {
        name: "Customer Journey Map",
        url: "https://miro.com/templates/customer-journey-map/",
        description: "Visualize user interactions and pain points"
      },
      {
        name: "Customer Touchpoint Map",
        url: "https://miro.com/templates/customer-touchpoint-map/",
        description: "Map customer interactions across different channels"
      },
      {
        name: "Service Blueprint",
        url: "https://miro.com/templates/service-blueprint/",
        description: "Design and optimize service experiences"
      },
      {
        name: "User Persona",
        url: "https://miro.com/templates/user-persona/",
        description: "Create detailed user profiles and characteristics"
      },
      {
        name: "Empathy Map",
        url: "https://miro.com/templates/empathy-map/",
        description: "Understand user needs and emotions"
      },
      {
        name: "User Interview",
        url: "https://miro.com/templates/user-interview/",
        description: "Structure and conduct user interviews"
      },
      {
        name: "Usability Testing",
        url: "https://miro.com/templates/usability-testing/",
        description: "Plan and conduct usability tests"
      },
      {
        name: "Competitive Analysis",
        url: "https://miro.com/templates/competitive-analysis/",
        description: "Analyze competitors and market position"
      },
      {
        name: "Research Synthesis",
        url: "https://miro.com/templates/research-synthesis/",
        description: "Organize and synthesize research findings"
      },
      {
        name: "User Research Plan",
        url: "https://miro.com/templates/user-research-plan/",
        description: "Plan and organize user research activities"
      }
    ]
  },
  "strategic_planning": {
    keywords: [
      "strategy", "planning", "roadmap", "business model", "goals",
      "objectives", "vision", "mission", "strategy planning",
      "business planning", "market analysis"
    ],
    semanticDescription: "Frameworks and tools for strategic business planning and analysis",
    templates: [
      {
        name: "Business Model Canvas",
        url: "https://miro.com/templates/business-model-canvas/",
        description: "Develop and display your business model"
      },
      {
        name: "Technology Roadmap",
        url: "https://miro.com/templates/technology-roadmap/",
        description: "Plan technology implementation and improvements"
      },
      {
        name: "Go-to-Market Strategy",
        url: "https://miro.com/templates/go-to-market-strategy/",
        description: "Plan product launch and market entry"
      },
      {
        name: "Marketing Funnel",
        url: "https://miro.com/templates/marketing-funnel/",
        description: "Visualize and optimize marketing processes"
      },
      {
        name: "Content Strategy",
        url: "https://miro.com/templates/content-strategy/",
        description: "Plan and organize content creation and distribution"
      },
      {
        name: "SWOT Analysis",
        url: "https://miro.com/templates/swot-analysis/",
        description: "Analyze strengths, weaknesses, opportunities, and threats"
      },
      {
        name: "Porter's Five Forces",
        url: "https://miro.com/templates/porters-five-forces/",
        description: "Analyze competitive forces in your industry"
      },
      {
        name: "Strategic Roadmap",
        url: "https://miro.com/templates/strategic-roadmap/",
        description: "Plan long-term strategic initiatives"
      },
      {
        name: "OKRs",
        url: "https://miro.com/templates/okrs/",
        description: "Set and track objectives and key results"
      },
      {
        name: "Vision Board",
        url: "https://miro.com/templates/vision-board/",
        description: "Visualize and communicate strategic vision"
      }
    ]
  },
  "agile": {
    keywords: [
      "sprint", "scrum", "agile", "retrospective", "standup", "backlog",
      "user stories", "kanban", "velocity", "story points", "sprint planning",
      "daily standup", "sprint review", "burndown", "epic", "feature"
    ],
    semanticDescription: "Tools and frameworks for agile project management and development",
    templates: [
      {
        name: "Agile Board",
        url: "https://miro.com/templates/agile-board/",
        description: "Manage tasks and track progress in agile projects"
      },
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
        name: "Conversion Funnel Backlog",
        url: "https://miro.com/templates/conversion-funnel-backlog/",
        description: "Structure backlog around conversion funnel"
      },
      {
        name: "Kanban Board",
        url: "https://miro.com/templates/kanban-board/",
        description: "Visualize and manage workflow"
      },
      {
        name: "User Story Mapping",
        url: "https://miro.com/templates/user-story-mapping/",
        description: "Map user journeys and prioritize features"
      },
      {
        name: "Sprint Review",
        url: "https://miro.com/templates/sprint-review/",
        description: "Review sprint outcomes and demonstrate work"
      },
      {
        name: "Daily Standup",
        url: "https://miro.com/templates/daily-standup/",
        description: "Conduct effective daily standup meetings"
      },
      {
        name: "Agile Roadmap",
        url: "https://miro.com/templates/agile-roadmap/",
        description: "Plan and visualize agile project timeline"
      },
      {
        name: "Story Points Estimation",
        url: "https://miro.com/templates/story-points-estimation/",
        description: "Estimate story points for user stories"
      }
    ]
  },
  "mapping": {
    keywords: [
      "mapping", "diagram", "flowchart", "process", "workflow",
      "swimlane", "stakeholder", "uml", "system", "architecture"
    ],
    semanticDescription: "Tools for creating various types of diagrams and visual maps",
    templates: [
      {
        name: "UML Diagram",
        url: "https://miro.com/templates/uml-diagram/",
        description: "Model business processes and software architecture"
      },
      {
        name: "Swimlane Diagram",
        url: "https://miro.com/templates/swimlane-diagram/",
        description: "Map processes across different stakeholders"
      },
      {
        name: "Stakeholder Mapping",
        url: "https://miro.com/templates/stakeholder-mapping/",
        description: "Analyze and organize stakeholder relationships"
      },
      {
        name: "Flowchart",
        url: "https://miro.com/templates/flowchart/",
        description: "Visualize processes and workflows"
      },
      {
        name: "Process Map",
        url: "https://miro.com/templates/process-map/",
        description: "Document and analyze business processes"
      },
      {
        name: "System Architecture",
        url: "https://miro.com/templates/system-architecture/",
        description: "Design and document system architecture"
      },
      {
        name: "Network Diagram",
        url: "https://miro.com/templates/network-diagram/",
        description: "Visualize network infrastructure and connections"
      },
      {
        name: "ERD Diagram",
        url: "https://miro.com/templates/erd-diagram/",
        description: "Design and document database relationships"
      },
      {
        name: "Sequence Diagram",
        url: "https://miro.com/templates/sequence-diagram/",
        description: "Model interactions between system components"
      },
      {
        name: "State Diagram",
        url: "https://miro.com/templates/state-diagram/",
        description: "Model system states and transitions"
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