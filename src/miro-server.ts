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
      name: "miro-prototype-mcp",
      version: "0.3.1",
      capabilities: { tools: {} },
      description: `Miro board management with optimized positioning and styling.

POSITIONING: Nested items use parent_top_left (0,0 = parent corner). Canvas items use canvas_center.
FRAMES: Standard sizes 1400x1000|1200x800|800x600. 50dp internal padding, 100dp between frames.
FONTS: title=20dp bold, header=16dp bold, body=12dp. Colors: positive=#16a34a, negative=#dc2626, neutral=#2563eb.
LAYOUT: 1400x1000 frame - left col x=350, right col x=1050, full width x=700. Title y=80, content y=200+.
RULES: Always set geometry.width for nested items. Adjust fontSize to fit. Return URLs when possible.`,
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
          name: "get_board_items",
          description: "Get board items with flexible filtering and output options",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              output: {
                type: "string",
                enum: ["content", "items", "both"],
                description: "Return text content only, full items, or both",
                default: "content"
              },
              itemTypes: {
                type: "array",
                items: { 
                  type: "string", 
                  enum: ["sticky_note", "text", "card", "frame", "shape", "image"] 
                },
                description: "Filter by specific item types (optional - returns all if not specified)"
              }
            },
            required: ["boardId"]
          }
        },
        {
          name: "get_efficient_board_analysis",
          description: "Analyze board content with smart summarization",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Miro board ID" },
              maxContent: { type: "number", description: "Max items (default: 15)", default: 15 }
            },
            required: ["boardId"]
          }
        },
        {
          name: "recommend_templates",
          description: "Get template suggestions for boards or meeting notes",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Miro board ID to analyze" },
              meetingNotes: { type: "string", description: "Meeting notes text to analyze" },
              maxRecommendations: { type: "number", description: "Max templates (default: 5)", default: 5 },
              maxContent: { type: "number", description: "Max content items (default: 20)", default: 20 }
            },
            anyOf: [
              { required: ["boardId"] },
              { required: ["meetingNotes"] }
            ]
          }
        },
        {
          name: "create_miro_board",
          description: "Create new Miro board",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Board name" },
              description: { type: "string", description: "Board description" },
              sharingPolicy: { type: "object", description: "Sharing settings" }
            },
            required: ["name"]
          }
        },
        {
          name: "update_item_position_or_parent",
          description: "Move item or change its parent",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Item ID" },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              parentId: { type: "string", description: "New parent ID" }
            },
            required: ["boardId", "itemId", "position"]
          }
        },
        {
          name: "create_frame",
          description: "Create new frame",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              title: { type: "string", description: "Frame title" },
              x: { type: "number", description: "X coordinate" },
              y: { type: "number", description: "Y coordinate" },
              width: { type: "number", description: "Width" },
              height: { type: "number", description: "Height" },
              parentId: { type: "string", description: "Parent frame ID" }
            },
            required: ["boardId", "title", "x", "y", "width", "height"]
          }
        },
        {
          name: "get_frame",
          description: "Get frame details",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Frame ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_frame",
          description: "Update frame properties",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Frame ID" },
              data: { type: "object", description: "Frame data" },
              style: { type: "object", description: "Frame style" },
              geometry: { type: "object", description: "Frame geometry" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_frame",
          description: "Delete frame",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Frame ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "create_text",
          description: "Create text item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              data: { type: "object", description: "Text content" },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Text geometry" },
              style: { type: "object", description: "Text style" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_text_item",
          description: "Get text item details",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Text item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_text",
          description: "Update text item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Text item ID" },
              data: { type: "object", description: "Text data" },
              style: { type: "object", description: "Text style" },
              geometry: { type: "object", description: "Text geometry" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_text",
          description: "Delete text item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Text item ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "create_sticky",
          description: "Create sticky note",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              data: { type: "object", description: "Sticky content" },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Sticky geometry" },
              style: { type: "object", description: "Sticky style" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_sticky",
          description: "Get sticky note details",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Sticky note ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_sticky",
          description: "Update sticky note",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Sticky note ID" },
              data: { type: "object", description: "Sticky data" },
              style: { type: "object", description: "Sticky style" },
              geometry: { type: "object", description: "Sticky geometry" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_sticky",
          description: "Delete sticky note",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Sticky note ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "share_board",
          description: "Share board with team members",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              emails: { type: "array", items: { type: "string" }, description: "Email addresses" },
              role: { type: "string", description: "Access role" },
              message: { type: "string", description: "Invitation message" }
            },
            required: ["boardId", "emails", "role"]
          }
        },
        {
          name: "create_card",
          description: "Create card item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              data: { type: "object", description: "Card content" },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              geometry: { type: "object", description: "Card geometry" },
              style: { type: "object", description: "Card style" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "data", "position"]
          }
        },
        {
          name: "get_card",
          description: "Get card details",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Card ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "update_card",
          description: "Update card item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Card ID" },
              data: { type: "object", description: "Card data" },
              style: { type: "object", description: "Card style" },
              geometry: { type: "object", description: "Card geometry" },
              parentId: { type: "string", description: "Parent ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "delete_card",
          description: "Delete card item",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              itemId: { type: "string", description: "Card ID" }
            },
            required: ["boardId", "itemId"]
          }
        },
        {
          name: "calculate_children_coordinates",
          description: "Calculate child widget coordinates",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              frameId: { type: "string", description: "Frame ID" },
              childWidgetId: { type: "string", description: "Child widget ID" }
            },
            required: ["boardId", "frameId", "childWidgetId"]
          }
        },
        {
          name: "get_frame_and_child_details",
          description: "Get frame and child widget details",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              frameId: { type: "string", description: "Frame ID" },
              childWidgetId: { type: "string", description: "Child widget ID" }
            },
            required: ["boardId", "frameId", "childWidgetId"]
          }
        },
        {
          name: "create_frame_layout",
          description: "Create layout within frame",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              frameId: { type: "string", description: "Frame ID" },
              layout: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Layout title" },
                  leftColumn: { type: "array", items: { type: "string" }, description: "Left column items" },
                  rightColumn: { type: "array", items: { type: "string" }, description: "Right column items" },
                  fullWidth: { type: "array", items: { type: "string" }, description: "Full width items" }
                }
              }
            },
            required: ["boardId", "frameId", "layout"]
          }
        },
        {
          name: "create_styled_text",
          description: "Create text with styling",
          inputSchema: {
            type: "object",
            properties: {
              boardId: { type: "string", description: "Board ID" },
              parentId: { type: "string", description: "Parent ID" },
              content: { type: "string", description: "Text content" },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
              type: { type: "string", enum: ["title", "header", "body", "positive", "negative", "neutral"], default: "body" },
              frameWidth: { type: "number", description: "Frame width for sizing" }
            },
            required: ["boardId", "parentId", "content", "position"]
          }
        },
        {
          name: "calculate_frame_positions",
          description: "Calculate optimal positions within frame",
          inputSchema: {
            type: "object",
            properties: {
              frameWidth: { type: "number", description: "Frame width" },
              frameHeight: { type: "number", description: "Frame height" }
            },
            required: ["frameWidth", "frameHeight"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) { 
          case "get_board_items":
            return await this.getBoardItems(request.params.arguments);
          case "get_efficient_board_analysis":
            return await this.getEfficientBoardAnalysis(request.params.arguments);
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
          case "calculate_children_coordinates":
            return await this.calculateChildrenCoordinates(request.params.arguments);
          case "get_frame_and_child_details":
            return await this.getFrameAndChildDetails(request.params.arguments);
          case "create_frame_layout":
            return await this.createFrameLayout(request.params.arguments);
          case "create_styled_text":
            return await this.createStyledText(request.params.arguments);
          case "calculate_frame_positions":
            return await this.calculateFramePositions(request.params.arguments);
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

  /**
 * Creates optimized error responses with concise, actionable messages
 */
private createErrorResponse(operation: string, error: Error, context?: string): any {
  // Extract the core error without verbose details
  let message = error.message;
  
  // Common error pattern simplifications
  if (message.includes('Miro API error:')) {
    message = message.replace('Miro API error: ', '');
  }
  
  if (message.includes('Failed to')) {
    message = message.replace('Failed to ', '');
  }
  
  // Handle specific error types with user-friendly messages
  if (message.includes('404') || message.includes('not found')) {
    message = `${operation}: Item not found`;
  } else if (message.includes('401') || message.includes('403')) {
    message = `${operation}: Access denied`;
  } else if (message.includes('429')) {
    message = `${operation}: Rate limited, retry later`;
  } else if (message.includes('timeout')) {
    message = `${operation}: Request timeout`;
  } else if (message.length > 100) {
    // Truncate very long error messages
    message = message.substring(0, 97) + '...';
  }
  
  // Add context if provided
  const finalMessage = context ? `${message} (${context})` : message;
  
  console.error(`[${operation}] Error: ${error.message}`); // Still log full error for debugging
  
  return {
    content: [{ type: "text", text: finalMessage }],
    isError: true
  };
}

/**
 * Extract text content from board items (simplified version for server use)
 */
private extractTextContent(item: any): string | null {
  if (item.isSupported === false) return null;

  switch (item.type) {
    case 'text':
    case 'sticky_note':
      return item.data?.content || item.data?.text || null;
    case 'card':
      const title = item.data?.title || '';
      const content = item.data?.content || '';
      return [title, content].filter(Boolean).join(' - ') || null;
    case 'frame':
      return item.data?.title || null;
    default:
      return null;
  }
}

private async getBoardItems(args: any) {
  const { 
    boardId: rawBoardId, 
    output = "content",
    itemTypes, 
    summarize = true, 
    maxItems = 20 
  } = args;

  const boardId = MiroClient.extractBoardId(rawBoardId);

  if (!this.miroClient) {
    const mockItems = [
      { id: "1", type: "sticky_note", data: { content: "Sprint planning" }, position: { x: 0, y: 0 } },
      { id: "2", type: "text", data: { content: "User stories" }, position: { x: 100, y: 100 } }
    ];
    
    const mockContent = ["Sprint planning", "User stories"];
    
    const mockResponse = output === "content" ? mockContent : 
                        output === "items" ? mockItems :
                        { content: mockContent, items: mockItems };
    
    return {
      content: [{ type: "text", text: JSON.stringify(mockResponse) }]
    };
  }

  try {
    console.error(`[getBoardItems] Fetching items for board: ${boardId}, output: ${output}, types: ${itemTypes?.join(',') || 'all'}`);

    if (output === "content") {
      // Use existing optimized getBoardContent (already summarized)
      const content = await this.miroClient.getBoardContent(boardId);
      console.error(`[getBoardItems] Retrieved ${content.length} content items`);
      
      return {
        content: [{ type: "text", text: JSON.stringify(content) }]
      };
    }

    if (output === "items") {
      const boardInfo = await this.miroClient.getBoardInfo(boardId);
      let items = boardInfo.items;

      if (itemTypes && itemTypes.length > 0) {
        items = items.filter(item => itemTypes.includes(item.type));
        console.error(`[getBoardItems] Filtered to ${items.length} items of types: ${itemTypes.join(',')}`);
      }

      console.error(`[getBoardItems] Retrieved ${items.length} full items`);
      return {
        content: [{ type: "text", text: JSON.stringify(items) }]
      };
    }

    if (output === "both") {
      // Get optimized content and filtered items
      const content = await this.miroClient.getBoardContent(boardId); // Already optimized
      const boardInfo = await this.miroClient.getBoardInfo(boardId);
      let items = boardInfo.items;

      if (itemTypes && itemTypes.length > 0) {
        items = items.filter(item => itemTypes.includes(item.type));
        console.error(`[getBoardItems] Filtered to ${items.length} items of types: ${itemTypes.join(',')}`);
      }

      console.error(`[getBoardItems] Retrieved ${content.length} content items and ${items.length} full items`);
      return {
        content: [{ type: "text", text: JSON.stringify({ content, items }) }]
      };
    }

  } catch (error) {
    return this.createErrorResponse('Board items retrieval', error as Error, boardId);
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

  // CONSOLIDATED: This replaces both get_template_recommendations and recommend_templates
  private async recommendTemplates(args: any) {
    const { 
      boardId: rawBoardId, 
      meetingNotes, 
      maxRecommendations = 5, 
      maxContent = 20 
    } = args;

    let content: string[];
    let contentType: string;

    if (rawBoardId) {
      // Analyze Miro board
      const boardId = MiroClient.extractBoardId(rawBoardId);

      if (!this.miroClient) {
        content = [
          "Sprint planning for Q2 2024",
          "User story: As a customer, I want to track my order",
          "Retrospective action items",
          "Design system components"
        ];
      } else {
        try {
          // Use the smart analysis method for efficiency
          const result = await this.miroClient.getSmartBoardAnalysis(boardId, {
            maxContent,
            includeTemplateRecommendations: true,
            maxTemplateRecommendations: maxRecommendations
          });

          // Return streamlined response
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                boardId,
                contentType: "miro_board",
                analysis: {
                  detectedKeywords: result.analysis.detectedKeywords,
                  identifiedCategories: result.analysis.identifiedCategories,
                  context: result.analysis.context
                },
                recommendations: result.templateRecommendations || []
              }, null, 2)
            }]
          };
        } catch (error) {
          // Fallback to basic content extraction
          content = await this.miroClient.getBoardContent(boardId);
        }
      }
      contentType = "miro_board";
    } else if (meetingNotes) {
      // Analyze meeting notes
      content = this.parseMeetingNotes(meetingNotes);
      contentType = "meeting_notes";
    } else {
      throw new Error("Please provide either a Miro board ID or meeting notes text.");
    }

    // Analyze content and generate recommendations
    const analysis = this.analyzeContent(content);
    const recommendations = this.generateRecommendations(analysis, maxRecommendations);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          ...(rawBoardId && { boardId: MiroClient.extractBoardId(rawBoardId) }),
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
      const trimmed = line.trim();
      if (trimmed.length < 3) return; // Skip very short lines

      const cleanedLine = trimmed
        .replace(/^[-*•]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^#{1,6}\s*/, '')
        .trim();

      if (cleanedLine.length > 0 && cleanedLine.length < 200) { // Skip overly long lines too
        content.push(cleanedLine);
      }
    });

    // Limit meeting notes analysis to prevent token overload
    return content.slice(0, 25);
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

  private async getEfficientBoardAnalysis(args: any) {
    const { boardId: rawBoardId, maxContent = 15 } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

    if (!this.miroClient) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            content: ["Sprint planning", "User stories", "Retrospective items"],
            keywords: ["sprint", "user", "retrospective"],
            categories: ["agile"],
            stats: { total: 25, kept: 3 }
          })
        }]
      };
    }

    try {
      console.error(`[getEfficientBoardAnalysis] Analyzing board: ${boardId}`);

      const result = await this.miroClient.getSmartBoardAnalysis(boardId, {
        maxContent,
        includeTemplateRecommendations: false
      });

      // Streamlined response - remove verbose nesting
      const streamlined = {
        content: result.contentSummary.keyContent,
        keywords: result.analysis.detectedKeywords,
        categories: result.analysis.identifiedCategories,
        context: result.analysis.context,
        stats: {
          total: result.contentSummary.contentStats.total,
          kept: result.contentSummary.contentStats.summarized
        }
      };

      console.error(`[getEfficientBoardAnalysis] Analysis complete: ${streamlined.content.length} items`);

      return {
        content: [{ type: "text", text: JSON.stringify(streamlined) }]
      };
    } catch (error) {
      return this.createErrorResponse('Board analysis', error as Error, boardId);
    }
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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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
    const { boardId: rawBoardId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

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

  private async calculateChildrenCoordinates(args: any) {
    const { boardId: rawBoardId, frameId, childWidgetId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

    if (!this.miroClient) {
      const mockCoordinates = {
        x: 100,
        y: 200,
        frameId,
        childWidgetId,
        boardId,
        mock: true
      };
      return {
        content: [{ type: "text", text: JSON.stringify(mockCoordinates, null, 2) }]
      };
    }

    try {
      const coordinates = await this.miroClient.calculateChildrenCoordinates(boardId, frameId, childWidgetId);
      return {
        content: [{ type: "text", text: JSON.stringify(coordinates, null, 2) }]
      };
    } catch (error) {
      console.error(`Error calculating children coordinates:`, error);
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async getFrameAndChildDetails(args: any) {
    const { boardId: rawBoardId, frameId, childWidgetId } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

    if (!this.miroClient) {
      const mockDetails = {
        frame: {
          id: frameId,
          title: "Mock Frame",
          position: { x: 0, y: 0 },
          geometry: { width: 400, height: 300 }
        },
        childWidget: {
          id: childWidgetId,
          type: "sticky_note",
          position: { x: 50, y: 50 },
          data: { content: "Mock content" }
        },
        calculatedPosition: { x: 100, y: 200 },
        boardId,
        mock: true
      };
      return {
        content: [{ type: "text", text: JSON.stringify(mockDetails, null, 2) }]
      };
    }

    try {
      const details = await this.miroClient.getFrameAndChildDetails(boardId, frameId, childWidgetId);
      return {
        content: [{ type: "text", text: JSON.stringify(details, null, 2) }]
      };
    } catch (error) {
      console.error(`Error getting frame and child details:`, error);
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createFrameLayout(args: any) {
    const { boardId: rawBoardId, frameId, layout } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

    if (!this.miroClient) {
      const mockLayout = {
        createdItems: [
          { id: "mock-title", type: "text", data: { content: layout.title || "Mock Title" } },
          { id: "mock-left-1", type: "text", data: { content: layout.leftColumn?.[0] || "Left item" } },
          { id: "mock-right-1", type: "text", data: { content: layout.rightColumn?.[0] || "Right item" } }
        ],
        frameId,
        boardId,
        layout,
        mock: true
      };
      return {
        content: [{ type: "text", text: JSON.stringify(mockLayout, null, 2) }]
      };
    }

    try {
      const createdItems = await this.miroClient.createFrameLayout(boardId, frameId, layout);
      return {
        content: [{ type: "text", text: JSON.stringify(createdItems, null, 2) }]
      };
    } catch (error) {
      console.error(`Error creating frame layout:`, error);
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async createStyledText(args: any) {
    const { boardId: rawBoardId, parentId, content, position, type = 'body', frameWidth } = args;
    const boardId = MiroClient.extractBoardId(rawBoardId);

    if (!this.miroClient) {
      const mockText = {
        id: "mock-styled-text",
        type: "text",
        data: { content },
        position,
        style: { fontSize: type === 'title' ? 20 : 12, color: '#1a1a1a' },
        parentId,
        boardId,
        textType: type,
        frameWidth,
        mock: true
      };
      return {
        content: [{ type: "text", text: JSON.stringify(mockText, null, 2) }]
      };
    }

    try {
      const createdText = await this.miroClient.createFrameText(boardId, parentId, content, position, type, frameWidth);
      return {
        content: [{ type: "text", text: JSON.stringify(createdText, null, 2) }]
      };
    } catch (error) {
      console.error(`Error creating styled text:`, error);
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }

  private async calculateFramePositions(args: any) {
    const { frameWidth, frameHeight } = args;

    if (!this.miroClient) {
      const mockPositions = {
        title: { x: frameWidth / 2, y: 80 },
        leftColumn: { x: frameWidth / 4 + 50, y: 150 },
        rightColumn: { x: 3 * frameWidth / 4 + 50, y: 150 },
        fullWidth: { x: frameWidth / 2, y: 150 },
        sectionStart: { x: frameWidth / 2, y: 250 },
        frameWidth,
        frameHeight,
        mock: true
      };
      return {
        content: [{ type: "text", text: JSON.stringify(mockPositions, null, 2) }]
      };
    }

    try {
      const positions = this.miroClient.calculateFramePositions(frameWidth, frameHeight);
      return {
        content: [{ type: "text", text: JSON.stringify(positions, null, 2) }]
      };
    } catch (error) {
      console.error(`Error calculating frame positions:`, error);
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
}

const server = new MiroTemplateRecommenderServer();
server.run().catch(console.error);