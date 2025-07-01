#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from 'dotenv';
dotenv.config();
import { MiroClient } from './miro-client.js';

// [TEMPLATE_CATEGORIES definition remains the same...]
const TEMPLATE_CATEGORIES = {
  "workshops": {
    keywords: [
      "workshop", "facilitation", "meeting", "collaboration", "team building",
      "icebreaker", "session", "attendees", "participants", "discussion",
      "facilitated", "breakout", "group exercise", "team activity"
    ],
    semanticDescription: "Activities and structures for facilitating group sessions, team building, and collaborative work",
    templates: [
      { name: "Workshop Agenda", url: "https://miro.com/templates/meeting-agenda/", description: "Structure your workshop sessions effectively" },
      { name: "Icebreaker Activities", url: "https://miro.com/templates/workshop-icebreaker-activities/", description: "Energize your team and break the ice" },
      { name: "Team Charter", url: "https://miro.com/templates/team-charter/", description: "Define team purpose, roles, and working agreements" },
      { name: "Event Planning", url: "https://miro.com/templates/event-planning/", description: "Plan and organize events with a visual checklist" },
      { name: "Team Meeting Agenda", url: "https://miro.com/templates/team-meeting-agenda/", description: "Structure team meetings with clear goals and action items" },
      { name: "One-on-one Meeting", url: "https://miro.com/templates/one-on-one-meeting/", description: "Structure productive one-on-one meetings" },
      { name: "Parking Lot Matrix", url: "https://miro.com/templates/ideas-parking-lot-matrix/", description: "Organize and prioritize ideas during meetings" },
      { name: "Design Sprint", url: "https://miro.com/templates/5-day-design-sprint/", description: "Run a 5-day design sprint workshop" },
      { name: "Meet the Team Template", url: "https://miro.com/templates/meet-the-team/", description: "Highlight your team members by showcasing their talents and expertise." }
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
      { name: "Mind Map", url: "https://miro.com/templates/mind-map/", description: "Visualize ideas and their connections" },
      { name: "Affinity Diagram", url: "https://miro.com/templates/affinity-diagram/", description: "Organize and consolidate information from brainstorming sessions" },
      { name: "Parking Lot Matrix Template", url: "https://miro.com/templates/ideas-parking-lot-matrix/", description: "Keep team meetings focused by managing ideas, distractions, and side discussions." },
      { name: "Fishbone Diagram", url: "https://miro.com/templates/fishbone-diagram/", description: "Identify root causes of problems" },
      { name: "Likert Scale", url: "https://miro.com/templates/likert-scale/", description: "Measure subjective data and gather feedback" },
      { name: "Brainwriting", url: "https://miro.com/templates/brainwriting/", description: "Generate ideas individually before sharing" },
      { name: "SCAMPER", url: "https://miro.com/templates/scamper/", description: "Use SCAMPER technique for creative thinking" },
      { name: "Six Thinking Hats", url: "https://miro.com/templates/six-thinking-hats/", description: "Explore different perspectives in problem-solving" },
      { name: "Random Words", url: "https://miro.com/templates/random-words/", description: "Generate new ideas, solve problems, and create clearer solutions outside your comfort zone." },
      { name: "Reverse Brainstorming", url: "https://miro.com/templates/reverse-brainstorming/", description: "Solve problems by thinking in reverse" }
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
      { name: "Customer Journey Map", url: "https://miro.com/templates/customer-journey-map/", description: "Visualize user interactions and pain points" },
      { name: "Customer Touchpoint Map", url: "https://miro.com/templates/customer-touchpoint-map/", description: "Map customer interactions across different channels" },
      { name: "Service Blueprint", url: "https://miro.com/templates/service-blueprint/", description: "Design and optimize service experiences" },
      { name: "User Persona", url: "https://miro.com/templates/personas/", description: "Create detailed user profiles and characteristics" },
      { name: "Empathy Map", url: "https://miro.com/templates/empathy-map/", description: "Understand user needs and emotions" },
      { name: "User Interview", url: "https://miro.com/templates/user-interview/", description: "Structure and conduct user interviews" },
      { name: "Competitive Analysis", url: "https://miro.com/templates/competitive-analysis/", description: "Analyze competitors and market position" },
      { name: "Research Insights Synthesis", url: "https://miro.com/templates/research-insight-synthesis/", description: "Organize and synthesize research findings" },
      { name: "User Research Kick-Off Canvas", url: "https://miro.com/templates/user-research-kick-off-canvas/", description: "Plan and organize user research activities" }
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
      { name: "Business Model Canvas", url: "https://miro.com/templates/business-model-canvas/", description: "Develop and display your business model" },
      { name: "Technology Roadmap", url: "https://miro.com/templates/technology-roadmap/", description: "Plan technology implementation and improvements" },
      { name: "Go-to-Market Strategy", url: "https://miro.com/templates/go-to-market-strategy/", description: "Plan product launch and market entry" },
      { name: "Marketing Funnel", url: "https://miro.com/templates/marketing-funnel/", description: "Visualize and optimize marketing processes" },
      { name: "Content Strategy", url: "https://miro.com/templates/content-strategy/", description: "Plan and organize content creation and distribution" },
      { name: "SWOT Analysis", url: "https://miro.com/templates/swot-analysis/", description: "Analyze strengths, weaknesses, opportunities, and threats" },
      { name: "Porter's Five Forces", url: "https://miro.com/templates/porters-five-forces/", description: "Analyze competitive forces in your industry" },
      { name: "Thematic Roadmapping (Vision & Strategy)", url: "https://miro.com/templates/thematic-roadmapping-vision-strategy/", description: "Are you ready to embark on a journey that will transform your team's strategy and alignment?" },
      { name: "OKR Planning", url: "https://miro.com/templates/okr-planning/", description: "Facilitate OKR planning sessions and keep your team aligned with your organization's goals." },
      { name: "Vision Board", url: "https://miro.com/templates/vision-board/", description: "Visualize and communicate strategic vision" }
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
      { name: "Agile Board", url: "https://miro.com/templates/agile-board/", description: "Manage tasks and track progress in agile projects" },
      { name: "Sprint Planning", url: "https://miro.com/templates/sprint-planning/", description: "Plan your next sprint effectively" },
      { name: "Retrospective", url: "https://miro.com/templates/retrospective/", description: "Reflect on team performance and improve" },
      { name: "Conversion Funnel Backlog", url: "https://miro.com/templates/conversion-funnel-backlog/", description: "Structure backlog around conversion funnel" },
      { name: "Kanban Framework Template", url: "https://miro.com/templates/kanban-framework/", description: "Improve processes and team efficiency by managing your workflow in a flexible and visual way." },
      { name: "User Story Mapping Template", url: "https://miro.com/templates/user-story-mapping-with-walkthrough/", description: "The Bluefruit Software user story mapping template offers a framework to help businesses prioritise software development." },
      { name: "Sprint Review", url: "https://miro.com/templates/sprint-review/", description: "Review sprint outcomes and demonstrate work" },
      { name: "Daily Standup", url: "https://miro.com/templates/daily-standup/", description: "Conduct effective daily standup meetings" },
      { name: "Agile Roadmap", url: "https://miro.com/templates/agile-roadmap/", description: "Plan and visualize agile project timeline" }
    ]
  },
  "mapping": {
    keywords: [
      "mapping", "diagram", "flowchart", "process", "workflow",
      "swimlane", "stakeholder", "uml", "system", "architecture"
    ],
    semanticDescription: "Tools for creating various types of diagrams and visual maps",
    templates: [
      { name: "UML Diagram", url: "https://miro.com/templates/uml-diagram/", description: "Model business processes and software architecture" },
      { name: "Swimlane Diagram Template", url: "https://miro.com/templates/swimlanes-diagram/", description: "Clarify roles and replace lengthy written processes with visuals." },
      { name: "Stakeholder Mapping", url: "https://miro.com/templates/stakeholder-map-basic/", description: "Identify and map out the people involved in a project, gain buy-in, and accomplish your goals." },
      { name: "Flowchart", url: "https://miro.com/templates/flowchart/", description: "Visualize processes and workflows" },
      { name: "Process Map", url: "https://miro.com/templates/process-map/", description: "Document and analyze business processes" },
      { name: "AWS Architecture Diagram Template", url: "https://miro.com/templates/aws-architecture-diagram/", description: "Translate Amazon Web Services architecture best practice into a visual format." },
      { name: "Google Cloud Architecture Diagram Template", url: "https://miro.com/templates/gcp-architecture/", description: "Visualize the deployment of your applications and optimize your processes." },
      { name: "Kubernetes Architecture Diagram Template", url: "https://miro.com/templates/kubernetes-diagram/", description: "Map out your application deployments and streamline your processes." },
      { name: "GenAI Application Workflow", url: "https://miro.com/templates/genai-application-workflow/", description: "This template will allow you to build custom Lamatic workflow and make the onboarding faster." },
      { name: "Business Case Canvas", url: "https://miro.com/templates/simple-business-case/", description: "Use the Business Case Template to cover all the key elements of your idea and easily get buy-in from stakeholders. Impress everyone with your project and achieve success." }
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
  style?: any;
  geometry?: any;
  parent?: any;
}

interface MiroBoardInfo {
  id: string;
  name: string;
  description?: string;
  items: MiroItem[];
}

class MiroTemplateRecommenderServer {
  private server: Server;
  private miroClient?: MiroClient;

  constructor() {
    this.server = new Server({
      name: "miro-template-recommender",
      version: "0.3.1",
      capabilities: { tools: {} },
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
              boardId: { type: "string", description: "The Miro board ID (e.g., uXjVKMOJbXg=)" }
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
              boardId: { type: "string", description: "The Miro board ID" }
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
              boardId: { type: "string", description: "The Miro board ID to analyze" }
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
              boardId: { type: "string", description: "The Miro board ID to analyze" },
              meetingNotes: { type: "string", description: "Meeting notes text to analyze" },
              maxRecommendations: { type: "number", description: "Maximum number of template recommendations (default: 5)", default: 5 }
            },
            anyOf: [ { required: ["boardId"] }, { required: ["meetingNotes"] } ]
          }
        },
        {
          name: "create_miro_board",
          description: "Create a new Miro board. Returns the created board info.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "The name of the new board" },
              description: { type: "string", description: "Optional description for the board" },
              sharingPolicy: {
                type: "object",
                description: "Optional sharing policy for the board (see Miro API)",
                properties: {
                  access: { type: "string", description: "Access level (private, view, comment, edit)" }
                },
                required: []
              }
            },
            required: ["name"]
          }
        },
        {
          name: "update_item_position_or_parent",
          description: "Update the position or parent of an item on a Miro board.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The item ID to update" },
              position: {
                type: "object",
                description: "New position for the item (x, y)",
                properties: {
                  x: { type: "number", description: "X coordinate" },
                  y: { type: "number", description: "Y coordinate" }
                },
                required: ["x", "y"]
              },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "itemId", "position"]
          }
        },
        {
          name: "create_frame",
          description: "Create a new frame on a Miro board.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              title: { type: "string", description: "Title of the frame" },
              x: { type: "number", description: "X coordinate of the frame center" },
              y: { type: "number", description: "Y coordinate of the frame center" },
              width: { type: "number", description: "Width of the frame" },
              height: { type: "number", description: "Height of the frame" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "title", "x", "y", "width", "height"]
          }
        },
        {
          name: "get_frame",
          description: "Get a specific frame from a Miro board by board ID and frame ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The frame (item) ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_frame",
          description: "Update a frame on a Miro board by board ID and frame ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The frame (item) ID" },
              data: { type: "object", description: "Frame data to update (title, etc.)" },
              style: { type: "object", description: "Frame style to update (optional)" },
              geometry: { type: "object", description: "Frame geometry to update (width, height, etc.) (optional)" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_frame",
          description: "Delete a specific frame from a Miro board by board ID and frame ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The frame (item) ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "create_text",
          description: "Create a new text item on a Miro board.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              data: { type: "object", description: "Text item data (content, etc.)" },
              position: { type: "object", description: "Position of the text item (x, y)", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Text geometry (width, etc.) (optional)" },
              style: { type: "object", description: "Text style (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_text_item",
          description: "Get a specific text item from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The text item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_text",
          description: "Update a text item on a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The text item ID" },
              data: { type: "object", description: "Text data to update (content, etc.)" },
              style: { type: "object", description: "Text style to update (optional)" },
              geometry: { type: "object", description: "Text geometry to update (width, etc.) (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_text",
          description: "Delete a specific text item from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The text item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "create_sticky",
          description: "Create a new sticky note on a Miro board.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              data: { type: "object", description: "Sticky note data (content, etc.)" },
              position: { type: "object", description: "Position of the sticky note (x, y)", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Sticky note geometry (width, height, etc.) (optional)" },
              style: { type: "object", description: "Sticky note style (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_sticky",
          description: "Get a specific sticky note from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The sticky note item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_sticky",
          description: "Update a sticky note on a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The sticky note item ID" },
              data: { type: "object", description: "Sticky note data to update (content, etc.)" },
              style: { type: "object", description: "Sticky note style to update (optional)" },
              geometry: { type: "object", description: "Sticky note geometry to update (width, height, etc.) (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_sticky",
          description: "Delete a specific sticky note from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The sticky note item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "share_board",
          description: "Share a Miro board and invite new members by email.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              emails: {
                type: "array",
                description: "Array of email addresses to invite",
                items: { type: "string" }
              },
              role: { type: "string", description: "Role for the invitee (viewer, commenter, editor)" },
              message: { type: "string", description: "Optional invitation message" }
            },
            required: ["boardId", "emails", "role"]
          }
        },
        {
          name: "create_card",
          description: "Create a new card item on a Miro board.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              data: { type: "object", description: "Card item data (title, description, etc.)" },
              position: { type: "object", description: "Position of the card (x, y)", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Card geometry (width, height, etc.) (optional)" },
              style: { type: "object", description: "Card style (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_card",
          description: "Get a specific card item from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The card item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_card",
          description: "Update a card item on a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The card item ID" },
              data: { type: "object", description: "Card data to update (title, description, etc.)" },
              style: { type: "object", description: "Card style to update (optional)" },
              geometry: { type: "object", description: "Card geometry to update (width, height, etc.) (optional)" },
              parentId: { type: "string", description: "Optional new parent frame ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_card",
          description: "Delete a specific card item from a Miro board by board ID and item ID.",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "The Miro board ID" },
              itemId: { type: "string", description: "The card item ID" }
            },
            required: ["boardId", "itemId"]
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
          case "create_miro_board":
            return await this.createMiroBoard(request.params.arguments);
          case "update_item_position_or_parent":
            return await this.updateItemPositionOrParent(request.params.arguments);
          case "create_frame":
            return await this.createFrame(request.params.arguments);
          case "get_frame":
            return await this.getFrame(request.params.arguments);
          case "update_frame":
            return await this.updateFrame(request.params.arguments);
          case "delete_frame":
            return await this.deleteFrame(request.params.arguments);
          case "create_text":
            return await this.createText(request.params.arguments);
          case "get_text_item":
            return await this.getTextItem(request.params.arguments);
          case "update_text":
            return await this.updateText(request.params.arguments);
          case "delete_text":
            return await this.deleteText(request.params.arguments);
          case "create_sticky":
            return await this.createSticky(request.params.arguments);
          case "get_sticky":
            return await this.getSticky(request.params.arguments);
          case "update_sticky":
            return await this.updateSticky(request.params.arguments);
          case "delete_sticky":
            return await this.deleteSticky(request.params.arguments);
          case "share_board":
            return await this.shareBoard(request.params.arguments);
          case "create_card":
            return await this.createCard(request.params.arguments);
          case "get_card":
            return await this.getCard(request.params.arguments);
          case "update_card":
            return await this.updateCard(request.params.arguments);
          case "delete_card":
            return await this.deleteCard(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${request.params.name}:`, error);
        return {
          content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
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
        content: [{ type: "text", text: JSON.stringify(mockContent, null, 2) }]
      };
    }
    
    try {
      console.error(`Attempting to get board content for board: ${boardId}`);
      const content = await this.miroClient.getBoardContent(boardId);
      console.error(`Successfully retrieved ${content.length} content items`);
      return {
        content: [{ type: "text", text: JSON.stringify(content, null, 2) }]
      };
    } catch (error) {
      console.error(`Error getting board content:`, error);
      // Try to get basic board info instead
      try {
        const boardInfo = await this.miroClient.getBoardInfo(boardId);
        console.error(`Retrieved board info with ${boardInfo.items.length} items`);
        
        // Extract any available content manually
        const fallbackContent: string[] = [];
        if (boardInfo.name) fallbackContent.push(boardInfo.name);
        
        for (const item of boardInfo.items) {
          if (item.data?.content) {
            const cleanContent = this.cleanHtmlContent(item.data.content);
            if (cleanContent) fallbackContent.push(cleanContent);
          }
          if (item.data?.title) {
            fallbackContent.push(item.data.title);
          }
          if (item.data?.text) {
            fallbackContent.push(item.data.text);
          }
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify(fallbackContent, null, 2) }]
        };
      } catch (fallbackError) {
        throw error; // Throw original error
      }
    }
  }

  private cleanHtmlContent(htmlContent: string): string {
    if (!htmlContent) return '';
    
    // Remove HTML tags and decode common entities
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode ampersands
      .replace(/&lt;/g, '<') // Decode less than
      .replace(/&gt;/g, '>') // Decode greater than
      .replace(/&quot;/g, '"') // Decode quotes
      .replace(/&#39;/g, "'") // Decode apostrophes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async getAllItems(args: any) {
    const { boardId } = args;
    if (!this.miroClient) {
      const mockItems = [
        { id: "1", type: "sticky_note", data: { content: "Sprint planning for Q2 2024" }, position: { x: 0, y: 0 } },
        { id: "2", type: "text", data: { content: "User story: As a customer, I want to track my order" }, position: { x: 100, y: 100 } }
      ];
      return {
        content: [{ type: "text", text: JSON.stringify(mockItems, null, 2) }]
      };
    }
    
    try {
      const boardInfo = await this.miroClient.getBoardInfo(boardId);
      return {
        content: [{ type: "text", text: JSON.stringify(boardInfo.items, null, 2) }]
      };
    } catch (error) {
      console.error(`Error getting all items:`, error);
      throw error;
    }
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
      try {
        boardContent = await this.miroClient.getBoardContent(boardId);
      } catch (error) {
        console.error(`Error getting board content for analysis:`, error);
        // Try fallback approach
        try {
          const boardInfo = await this.miroClient.getBoardInfo(boardId);
          boardContent = [];
          if (boardInfo.name) boardContent.push(boardInfo.name);
          
          for (const item of boardInfo.items) {
            if (item.data?.content) {
              const cleanContent = this.cleanHtmlContent(item.data.content);
              if (cleanContent) boardContent.push(cleanContent);
            }
            if (item.data?.title) boardContent.push(item.data.title);
            if (item.data?.text) boardContent.push(item.data.text);
          }
        } catch (fallbackError) {
          throw error;
        }
      }
    }
    
    const analysis = this.analyzeContent(boardContent);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          boardId,
          contentSummary: { itemCount: boardContent.length, items: boardContent },
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
      if (!this.miroClient) {
        content = [
          "Sprint planning for Q2 2024",
          "User story: As a customer, I want to track my order",
          "Retrospective action items",
          "Design system components"
        ];
      } else {
        try {
          content = await this.miroClient.getBoardContent(boardId);
        } catch (error) {
          console.error(`Error getting board content for recommendations:`, error);
          // Try fallback approach
          try {
            const boardInfo = await this.miroClient.getBoardInfo(boardId);
            content = [];
            if (boardInfo.name) content.push(boardInfo.name);
            
            for (const item of boardInfo.items) {
              if (item.data?.content) {
                const cleanContent = this.cleanHtmlContent(item.data.content);
                if (cleanContent) content.push(cleanContent);
              }
              if (item.data?.title) content.push(item.data.title);
              if (item.data?.text) content.push(item.data.text);
            }
          } catch (fallbackError) {
            throw error;
          }
        }
      }
      contentType = "miro_board";
    } else if (meetingNotes) {
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
      .sort(([, a], [, b]) => b - a)
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
      "meetings": "Meeting management and follow-up",
      "research": "Research and user insights",
      "strategic_planning": "Strategic business planning",
      "mapping": "Process mapping and diagramming"
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
    console.error("Miro Template Recommender MCP server running on stdio");
  }

  private async createMiroBoard(args: any) {
    const defaultSharingPolicy = {
      "policy": {
        "sharingPolicy": {
          "access": "edit",
          "inviteToAccountAndBoardLinkAccess": "editor",
          "organizationAccess": "edit",
          "teamAccess": "edit"
        },
        "permissionsPolicy": {
          "collaborationToolsStartAccess": "all_editors",
          "copyAccess": "anyone",
          "sharingAccess": "team_members_with_editing_rights"
        }
      }
    };
    const sharingPolicy = args.sharingPolicy || defaultSharingPolicy;
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: "mock-board-id", name: args.name, description: args.description || "", sharingPolicy }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.createBoard(args.name, args.description, sharingPolicy);
      // Automatically add simon.h@miro.com as a member
      let shareResult = null;
      if (result && result.id) {
        try {
          shareResult = await this.miroClient.shareBoard(result.id, {
            emails: ["simon.h@miro.com"],
            role: "editor"
          });
        } catch (shareError) {
          shareResult = { error: (shareError as Error).message };
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ board: result, memberInvite: shareResult }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async updateItemPositionOrParent(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, position: args.position, parentId: args.parentId || null }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.updateItemPositionOrParent(args.boardId, args.itemId, args.position, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createFrame(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: "mock-frame-id", boardId: args.boardId, title: args.title, x: args.x, y: args.y, width: args.width, height: args.height }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.createFrame(args.boardId, args.title, args.x, args.y, args.width, args.height);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async getFrame(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.getFrame(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async updateFrame(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, updated: true, data: args.data, style: args.style, geometry: args.geometry, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.updateFrame(args.boardId, args.itemId, args.data, args.style, args.geometry);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async deleteFrame(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, deleted: true, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.deleteFrame(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createText(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: "mock-text-id", ...args }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.createText(args.boardId, args.data, args.position, args.geometry, args.style, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async getTextItem(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.getTextItem(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async updateText(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, updated: true, data: args.data, style: args.style, geometry: args.geometry, parentId: args.parentId || null, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.updateText(args.boardId, args.itemId, args.data, args.style, args.geometry, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async deleteText(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, deleted: true, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.deleteText(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createSticky(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: "mock-sticky-id", ...args }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.createSticky(args.boardId, args.data, args.position, args.geometry, args.style, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async getSticky(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.getSticky(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async updateSticky(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, updated: true, data: args.data, style: args.style, geometry: args.geometry, parentId: args.parentId || null, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.updateSticky(args.boardId, args.itemId, args.data, args.style, args.geometry, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async deleteSticky(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, deleted: true, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.deleteSticky(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async shareBoard(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ boardId: args.boardId, emails: args.emails, role: args.role, message: args.message, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.shareBoard(args.boardId, {
        emails: args.emails,
        role: args.role,
        message: args.message
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createCard(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: "mock-card-id", ...args }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.createCard(args.boardId, args.data, args.position, args.geometry, args.style, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async getCard(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.getCard(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async updateCard(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, updated: true, data: args.data, style: args.style, geometry: args.geometry, parentId: args.parentId || null, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.updateCard(args.boardId, args.itemId, args.data, args.style, args.geometry, args.parentId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async deleteCard(args: any) {
    if (!this.miroClient) {
      return { content: [{ type: "text", text: JSON.stringify({ id: args.itemId, boardId: args.boardId, deleted: true, mock: true }, null, 2) }] };
    }
    try {
      const result = await this.miroClient.deleteCard(args.boardId, args.itemId);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
}

const server = new MiroTemplateRecommenderServer();
server.run().catch(console.error);