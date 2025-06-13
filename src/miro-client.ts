// src/miro-client.ts
import axios from 'axios';

export interface MiroItem {
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

export interface MiroBoardInfo {
  id: string;
  name: string;
  description?: string;
  items: MiroItem[];
}

export class MiroClient {
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
      // Get board details
      const boardResponse = await this.makeRequest(`/boards/${boardId}`);
      
      // Get board items
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

  async getBoardContent(boardId: string): Promise<string[]> {
    try {
      const boardInfo = await this.getBoardInfo(boardId);
      const content: string[] = [];

      // Extract text content from various item types
      for (const item of boardInfo.items) {
        const textContent = this.extractTextFromItem(item);
        if (textContent) {
          content.push(textContent);
        }
      }

      // Add board name and description
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

  private extractTextFromItem(item: MiroItem): string | null {
    // Handle different item types
    switch (item.type) {
      case 'text':
      case 'sticky_note':
        return item.data.content || item.data.text || null;
      case 'shape':
        return item.data.content || null;
      case 'card':
        return item.data.title || item.data.content || null;
      default:
        // Try to extract any text content available
        return item.data.content || item.data.text || item.data.title || null;
    }
  }

  async getItemsByType(boardId: string, itemType: string): Promise<MiroItem[]> {
    try {
      const response = await this.makeRequest(`/boards/${boardId}/items?type=${itemType}`);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch items of type ${itemType}: ${(error as Error).message}`);
    }
  }
}

// Enhanced template recommendation logic
export class TemplateRecommendationEngine {
  private miroClient: MiroClient;

  constructor(accessToken: string) {
    this.miroClient = new MiroClient(accessToken);
  }

  async analyzeBoard(boardId: string): Promise<{
    content: string[];
    itemTypes: string[];
    boardInfo: MiroBoardInfo;
    keywords: string[];
    categories: string[];
    context: string;
  }> {
    const boardInfo = await this.miroClient.getBoardInfo(boardId);
    const content = await this.miroClient.getBoardContent(boardId);
    
    // Get unique item types
    const itemTypes = [...new Set(boardInfo.items.map(item => item.type))];
    
    // Analyze content for keywords and categories
    const analysis = this.analyzeContentForKeywords(content);
    
    return {
      content,
      itemTypes,
      boardInfo,
      keywords: analysis.keywords,
      categories: analysis.categories,
      context: analysis.context
    };
  }

  private analyzeContentForKeywords(content: string[]): {
    keywords: string[];
    categories: string[];
    context: string;
  } {
    const allText = content.join(" ").toLowerCase();
    const foundKeywords: string[] = [];
    const matchedCategories: string[] = [];

    // Template categories with enhanced keyword matching
    const templateCategories = {
      "brainstorming": {
        keywords: ["ideas", "creativity", "innovation", "brainstorm", "ideation", "concepts", "mind map", "creative thinking"],
        weight: 1.0
      },
      "planning": {
        keywords: ["plan", "roadmap", "timeline", "schedule", "strategy", "goals", "objectives", "milestone", "gantt"],
        weight: 1.0
      },
      "agile": {
        keywords: ["sprint", "scrum", "agile", "retrospective", "standup", "backlog", "user stories", "kanban", "velocity"],
        weight: 1.2
      },
      "design": {
        keywords: ["design", "prototype", "wireframe", "ux", "ui", "user experience", "mockup", "persona", "usability"],
        weight: 1.1
      },
      "analysis": {
        keywords: ["analysis", "research", "data", "insights", "swot", "competitive", "market", "metrics", "kpi"],
        weight: 1.0
      },
      "workshops": {
        keywords: ["workshop", "facilitation", "meeting", "collaboration", "team building", "icebreaker", "session"],
        weight: 0.9
      }
    };

    // Enhanced matching with weights
    for (const [category, categoryData] of Object.entries(templateCategories)) {
      const matchingKeywords = categoryData.keywords.filter(keyword => 
        allText.includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        foundKeywords.push(...matchingKeywords);
        // Add category multiple times based on weight for better ranking
        const weightedCount = Math.ceil(matchingKeywords.length * categoryData.weight);
        for (let i = 0; i < weightedCount; i++) {
          matchedCategories.push(category);
        }
      }
    }

    // Generate context description
    const uniqueCategories = [...new Set(matchedCategories)];
    const context = this.generateContextDescription(uniqueCategories);

    return {
      keywords: [...new Set(foundKeywords)],
      categories: uniqueCategories,
      context
    };
  }

  private generateContextDescription(categories: string[]): string {
    const contextMap: { [key: string]: string } = {
      "agile": "Agile/Scrum methodology",
      "design": "Design and UX work",
      "planning": "Strategic planning",
      "brainstorming": "Ideation and creativity",
      "analysis": "Research and analysis",
      "workshops": "Team collaboration and workshops"
    };

    const contexts = categories.map(cat => contextMap[cat]).filter(Boolean);
    
    return contexts.length > 0 
      ? `Board appears to focus on: ${contexts.join(", ")}`
      : "General collaborative work";
  }
}