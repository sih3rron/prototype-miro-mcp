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

// --- GONG API INTEGRATION ---
const GONG_API_BASE = 'https://us-45594.api.gong.io/v2';
const keys = `${Buffer.from(`${process.env.GONG_KEY}:${process.env.GONG_SECRET}`).toString('base64')}`

// In-memory cache for paginated Gong API results
const gongCache = new Map<string, any>();

/**
 * Fetches all paginated results from a Gong API endpoint using cursor-based pagination.
 * Caches results in-memory by endpoint+params. Only /calls is paginated; others fallback to a single request.
 * @param endpoint API endpoint (e.g., '/calls')
 * @param params Query parameters
 */
// Improved pagination logic with better debugging
async function gongGet(endpoint: string, params: any = {}) {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  
  // Temporarily disable cache for debugging
  // if (gongCache.has(cacheKey)) {
  //   return gongCache.get(cacheKey);
  // }

  async function fetchWithRetry(fetchFn: () => Promise<any>): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        return await fetchFn();
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          let wait = retryAfter 
            ? parseFloat(retryAfter) * 1000 
            : Math.min((2 ** attempt + Math.random()) * 3000, 60000);
          
          console.error(`[gongGet] Rate limit hit. Waiting ${Math.round(wait)}ms...`); // Fixed
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          await new Promise(res => setTimeout(res, wait));
          attempt++;
        } else {
          console.error(`[gongGet] Error on attempt ${attempt + 1}:`, error.message);
          throw error;
        }
      }
    }
  }

  // Fixed pagination logic for /calls endpoint
if (endpoint === '/calls') {
  let allCalls: any[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 50; // Safety limit
  
  do {
    const query = { ...params };
    if (cursor) {
      query.cursor = cursor;
    }
    
    console.error(`[gongGet] Fetching page ${pageCount + 1}, cursor: ${cursor || 'none'}`);
    console.error(`[gongGet] Query params:`, JSON.stringify(query, null, 2));
    
    const url = `${GONG_API_BASE}${endpoint}`;
    const response = await fetchWithRetry(async () => {
      return axios.get(url, {
        headers: {
          'Authorization': `Basic ${keys}`,
          'Content-Type': 'application/json',
        },
        params: query,
      }).then(r => r.data);
    });
    
    // Debug: Log the full response structure to understand Gong's format
    console.error(`[gongGet] Full response keys:`, Object.keys(response));
    console.error(`[gongGet] Response structure:`, JSON.stringify({
      callsCount: response.calls?.length || 0,
      recordsCount: response.records?.length || 0,
      hasNext: !!response.next,
      hasRecordsCursor: !!(response.records?.cursor),
      hasCursor: !!response.cursor,
      hasNextCursor: !!response.nextCursor
    }, null, 2));
    
    // Gong API typically returns calls in response.calls or response.records
    let pageCalls: any[] = [];
    if (Array.isArray(response.calls)) {
      pageCalls = response.calls;
    } else if (Array.isArray(response.records)) {
      pageCalls = response.records;
    } else if (response.data && Array.isArray(response.data)) {
      pageCalls = response.data;
    }
    
    console.error(`[gongGet] Page ${pageCount + 1} returned ${pageCalls.length} calls`);
    
    // Debug: Show sample call titles if available
    if (pageCalls.length > 0) {
      const sampleTitles = pageCalls.slice(0, 3).map((c: any) => c.title || c.name || c.subject || 'No title field');
      console.error(`[gongGet] Sample titles from page ${pageCount + 1}:`, sampleTitles);
      
      // Debug: Show available fields in first call
      console.error(`[gongGet] Available fields in first call:`, Object.keys(pageCalls[0]));
    }
    
    if (pageCalls.length > 0) {
      allCalls = allCalls.concat(pageCalls);
    }
    
    // Try multiple possible cursor locations based on Gong API documentation
    cursor = null;
    if (response.records && response.records.cursor) {
      cursor = response.records.cursor;
      console.error(`[gongGet] Found cursor in response.records.cursor:`, cursor);
    } else if (response.next) {
      cursor = response.next;
      console.error(`[gongGet] Found cursor in response.next:`, cursor);
    } else if (response.cursor) {
      cursor = response.cursor;
      console.error(`[gongGet] Found cursor in response.cursor:`, cursor);
    } else if (response.nextCursor) {
      cursor = response.nextCursor;
      console.error(`[gongGet] Found cursor in response.nextCursor:`, cursor);
    } else {
      console.error(`[gongGet] No cursor found. Available response fields:`, Object.keys(response));
    }
    
    pageCount++;
    
    console.error(`[gongGet] After page ${pageCount}: Total calls so far: ${allCalls.length}, Next cursor: ${cursor || 'none'}`);
    
    // Safety check to prevent infinite loops
    if (pageCount >= maxPages) {
      console.error(`[gongGet] Reached max pages limit (${maxPages})`); // Changed from console.warn
      break;
    }
    
    // Add a small delay between requests to avoid rate limiting
    if (cursor) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } while (cursor);
  
  console.error(`[gongGet] FINAL RESULT: Total calls fetched: ${allCalls.length} across ${pageCount} pages`);
  
  const result = { calls: allCalls, next: null };
  gongCache.set(cacheKey, result);
  return result;
  }
}

async function gongPost(endpoint: string, data: any) {
  const url = `${GONG_API_BASE}${endpoint}`;
  return axios.post(url, data, {
    headers: {
      'Authorization': `Basic ${keys}`,
      'Content-Type': 'application/json',
    },
  }).then(r => r.data);
}

// Improved fuzzy match function with better matching strategies
function fuzzyMatch(callTitle: string, searchTerm: string): boolean {
  const title = callTitle.toLowerCase().trim();
  const term = searchTerm.toLowerCase().trim();
  
  // Direct match - exact or substring
  if (title === term || title.includes(term) || term.includes(title)) {
    return true;
  }
  
  // Word-based matching - check if any words from search term appear in title
  const searchWords = term.split(/\s+/).filter(word => word.length > 2); // Ignore very short words
  const titleWords = title.split(/\s+/);
  
  // If any significant word from search term is found in title
  for (const searchWord of searchWords) {
    for (const titleWord of titleWords) {
      if (titleWord.includes(searchWord) || searchWord.includes(titleWord)) {
        return true;
      }
    }
  }
  
  // Partial word matching - useful for company names
  // Check if search term appears as part of words in title
  const titleNormalized = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  const termNormalized = term.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  
  if (titleNormalized.includes(termNormalized)) {
    return true;
  }
  
  // Levenshtein distance for close matches (only for reasonably sized strings)
  if (term.length >= 3 && title.length >= 3) {
    const similarity = calculateSimilarity(title, term);
    if (similarity > 0.6) { // Lowered threshold for better matching
      return true;
    }
    
    // Also check word-by-word similarity for multi-word searches
    for (const searchWord of searchWords) {
      for (const titleWord of titleWords) {
        if (searchWord.length >= 3 && titleWord.length >= 3) {
          const wordSimilarity = calculateSimilarity(titleWord, searchWord);
          if (wordSimilarity > 0.75) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

function calculateSimilarity(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  
  const dist = matrix[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// Alternative: More flexible matching function
function flexibleMatch(callTitle: string, searchTerm: string): boolean {
  const title = callTitle.toLowerCase().trim();
  const term = searchTerm.toLowerCase().trim();
  
  // Remove common punctuation and normalize spaces
  const normalizeText = (text: string) => 
    text.replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
  
  const normalizedTitle = normalizeText(title);
  const normalizedTerm = normalizeText(term);
  
  // Direct substring match
  if (normalizedTitle.includes(normalizedTerm)) {
    return true;
  }
  
  // Split into words and check various combinations
  const titleWords = normalizedTitle.split(' ').filter(w => w.length > 1);
  const termWords = normalizedTerm.split(' ').filter(w => w.length > 1);
  
  // Check if all search words appear somewhere in title (order doesn't matter)
  const allWordsFound = termWords.every(searchWord => 
    titleWords.some(titleWord => 
      titleWord.includes(searchWord) || 
      searchWord.includes(titleWord) ||
      calculateSimilarity(titleWord, searchWord) > 0.8
    )
  );
  
  if (allWordsFound && termWords.length > 0) {
    return true;
  }
  
  // Check for partial matches with decent similarity
  for (const searchWord of termWords) {
    if (searchWord.length >= 3) {
      for (const titleWord of titleWords) {
        if (titleWord.length >= 3) {
          const sim = calculateSimilarity(titleWord, searchWord);
          if (sim > 0.7) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

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
        url: "https://miro.com/templates/meeting-agenda/",
        description: "Structure your workshop sessions effectively"
      },
      {
        name: "Icebreaker Activities",
        url: "https://miro.com/templates/workshop-icebreaker-activities/",
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
        url: "https://miro.com/templates/ideas-parking-lot-matrix/",
        description: "Organize and prioritize ideas during meetings"
      },
      {
        name: "Design Sprint",
        url: "https://miro.com/templates/5-day-design-sprint/",
        description: "Run a 5-day design sprint workshop"
      },
      {
        name: "Meet the Team Template",
        url: "https://miro.com/templates/meet-the-team/",
        description: "Highlight your team members by showcasing their talents and expertise."
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
        name: "Parking Lot Matrix Template",
        url: "https://miro.com/templates/ideas-parking-lot-matrix/",
        description: "Keep team meetings focused by managing ideas, distractions, and side discussions."
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
        name: "Random Words",
        url: "https://miro.com/templates/random-words/",
        description: "Generate new ideas, solve problems, and create clearer solutions outside your comfort zone."
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
        url: "https://miro.com/templates/personas/",
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
        name: "Competitive Analysis",
        url: "https://miro.com/templates/competitive-analysis/",
        description: "Analyze competitors and market position"
      },
      {
        name: "Research Insights Synthesis",
        url: "https://miro.com/templates/research-insight-synthesis/",
        description: "Organize and synthesize research findings"
      },
      {
        name: "User Research Kick-Off Canvas",
        url: "https://miro.com/templates/user-research-kick-off-canvas/",
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
        name: "Thematic Roadmapping (Vision & Strategy)",
        url: "https://miro.com/templates/thematic-roadmapping-vision-strategy/",
        description: "Are you ready to embark on a journey that will transform your team's strategy and alignment?"
      },
      {
        name: "OKR Planning",
        url: "https://miro.com/templates/okr-planning/",
        description: "Facilitate OKR planning sessions and keep your team aligned with your organization's goals."
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
        name: "Kanban Framework Template",
        url: "https://miro.com/templates/kanban-framework/",
        description: "Improve processes and team efficiency by managing your workflow in a flexible and visual way."
      },
      {
        name: "User Story Mapping Template",
        url: "https://miro.com/templates/user-story-mapping-with-walkthrough/",
        description: "The Bluefruit Software user story mapping template offers a framework to help businesses prioritise software development."
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
        name: "Swimlane Diagram Template",
        url: "https://miro.com/templates/swimlanes-diagram/",
        description: "Clarify roles and replace lengthy written processes with visuals."
      },
      {
        name: "Stakeholder Mapping",
        url: "https://miro.com/templates/stakeholder-map-basic/",
        description: "Identify and map out the people involved in a project, gain buy-in, and accomplish your goals."
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
        name: "AWS Architecture Diagram Template",
        url: "https://miro.com/templates/aws-architecture-diagram/",
        description: "Translate Amazon Web Services architecture best practice into a visual format."
      },
      {
        name: "Google Cloud Architecture Diagram Template",
        url: "https://miro.com/templates/gcp-architecture/",
        description: "Visualize the deployment of your applications and optimize your processes."
      },
      {
        name: "Kubernetes Architecture Diagram Template",
        url: "https://miro.com/templates/kubernetes-diagram/",
        description: "Map out your application deployments and streamline your processes."
      },
      {
        name: "GenAI Application Workflow",
        url: "https://miro.com/templates/genai-application-workflow/",
        description: "This template will allow you to build custom Lamatic workflow and make the onboarding faster."
      },
      {
        name: "Business Case Canvas",
        url: "https://miro.com/templates/simple-business-case/",
        description: "Use the Business Case Template to cover all the key elements of your idea and easily get buy-in from stakeholders. Impress everyone with your project and achieve success."
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
        },
        {
          name: "search_gong_calls",
          description: "Search Gong calls by customer name and date range, returns matching calls for user selection.",
          inputSchema: {
            type: "object",
            properties: {
              customerName: { type: "string", description: "Customer name to search for (fuzzy match in call title)" },
              fromDate: { type: "string", description: "Start date (ISO 8601, optional, defaults to 3 months ago)" },
              toDate: { type: "string", description: "End date (ISO 8601, optional, defaults to today)" }
            },
            required: ["customerName"]
          }
        },
        {
          name: "get_gong_call_details",
          description: "Fetch highlights and keypoints for a Gong call by callId.",
          inputSchema: {
            type: "object",
            properties: {
              callId: { type: "string", description: "The Gong call ID" }
            },
            required: ["callId"]
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
          case "search_gong_calls":
            return await this.searchGongCalls(request.params.arguments);
          case "get_gong_call_details":
            return await this.getGongCallDetails(request.params.arguments);
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

  private async searchGongCalls(args: any) {
    const { customerName, fromDate, toDate } = args;
    
    const now = new Date();
    let from: Date, to: Date;
    
    if (fromDate) {
      from = new Date(fromDate);
      from.setHours(0, 0, 0, 0); // Start of specified day
    } else {
      from = new Date(now);
      from.setMonth(from.getMonth() - 8);
      from.setHours(0, 0, 0, 0);
    }
    
    if (toDate) {
      to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of specified day
    } else {
      to = new Date(now);
      to.setHours(23, 59, 59, 999);
    }
    
    const fromISO = from.toISOString();
    const toISO = to.toISOString();
    
      console.error(`[searchGongCalls] Searching for "${customerName}" from ${fromISO} to ${toISO}`);
    
    let calls: any[];
    if (!keys) {
      // Mock data remains the same
      calls = [
        { id: "1", title: "Call with Nokia - Q2 Review", url: "https://app.gong.io/call/1", started: "2024-05-01T10:00:00Z", primaryUserId: "u1" },
        { id: "2", title: "Call with Acme Corp - Demo", url: "https://app.gong.io/call/2", started: "2024-05-02T11:00:00Z", primaryUserId: "u2" }
      ];
    } else {
      const data = await gongGet('/calls', { 
        fromDateTime: fromISO, 
        toDateTime: toISO,
        limit: 100 // Add explicit limit if API supports it
      });
      
      calls = (data?.calls || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        started: c.started,
        primaryUserId: c.primaryUserId
      }));
      
      console.error(`[searchGongCalls] Total calls in date range: ${calls.length}`);
    }
    
    // Apply fuzzy matching
    const matches = calls.filter(call => flexibleMatch(call.title, customerName));
    
        console.error(`[searchGongCalls] Found ${matches.length} matches for "${customerName}"`);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          customerName,
          from: fromISO,
          to: toISO,
          totalCallsInRange: calls.length,
          matches
        }, null, 2)
      }]
    };
  }

  private async getGongCallDetails(args: any) {
    const { callId } = args;
    let details: any;
    if (!keys) {
      // Mock data
      details = {
        callId,
        highlights: ["Key moment 1", "Key moment 2"],
        keyPoints: ["Summary point 1", "Summary point 2"]
      };
    } else {
      const postBody = {
        filter: { callIds: [callId] },
        contentSelector: {
          exposedFields: {
            parties: true,
            content: {
              structure: false,
              topics: false,
              trackers: false,
              trackerOccurrences: false,
              pointsOfInterest: false,
              brief: true,
              outline: true,
              highlights: true,
              callOutcome: false,
              keyPoints: true
            }
          }
        }
      };
      const data = await gongPost('/calls/extensive', postBody);
      details = data;
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify(details, null, 2)
      }]
    };
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