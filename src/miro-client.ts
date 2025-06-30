// src/miro-client.ts
import axios from 'axios';

export interface MiroItem {
  id: string;
  type: string;
  data: {
    content?: string;
    text?: string;
    title?: string;
    format?: string;
    showContent?: boolean;
  };
  position: {
    x: number;
    y: number;
  };
  style?: any;
  geometry?: any;
  parent?: any;
  isSupported?: boolean;
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
    // Skip unsupported items
    if (item.isSupported === false) {
      return null;
    }

    // Handle different item types based on actual Miro API structure
    switch (item.type) {
      case 'text':
      case 'sticky_note':
        // For text items, check data.content first, then try to parse HTML content
        if (item.data?.content) {
          return this.cleanHtmlContent(item.data.content);
        }
        return item.data?.text || null;
        
      case 'shape':
        // Shapes might have content in data.content
        if (item.data?.content) {
          return this.cleanHtmlContent(item.data.content);
        }
        return null;
        
      case 'card':
        // Cards typically have title and content
        const cardTitle = item.data?.title || '';
        const cardContent = item.data?.content ? this.cleanHtmlContent(item.data.content) : '';
        return [cardTitle, cardContent].filter(Boolean).join(' - ') || null;
        
      case 'frame':
        // Frames have titles
        return item.data?.title || null;
        
      case 'image':
      case 'unknown':
        // Skip images and unknown types for text content
        return null;
        
      default:
        // Try to extract any available text content
        const availableContent = [
          item.data?.title,
          item.data?.content ? this.cleanHtmlContent(item.data.content) : null,
          item.data?.text
        ].filter(Boolean);
        
        return availableContent.length > 0 ? availableContent.join(' ') : null;
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
      .trim();
  }

  async getItemsByType(boardId: string, itemType: string): Promise<MiroItem[]> {
    try {
      const response = await this.makeRequest(`/boards/${boardId}/items?type=${itemType}`);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch items of type ${itemType}: ${(error as Error).message}`);
    }
  }

  // Add method to get all sticky notes specifically
  async getStickyNotes(boardId: string): Promise<string[]> {
    try {
      const stickyNotes = await this.getItemsByType(boardId, 'sticky_note');
      return stickyNotes
        .map(note => this.extractTextFromItem(note))
        .filter((content): content is string => content !== null);
    } catch (error) {
      throw new Error(`Failed to fetch sticky notes: ${(error as Error).message}`);
    }
  }

  // Add method to get all text items specifically
  async getTextItems(boardId: string): Promise<string[]> {
    try {
      const textItems = await this.getItemsByType(boardId, 'text');
      return textItems
        .map(item => this.extractTextFromItem(item))
        .filter((content): content is string => content !== null);
    } catch (error) {
      throw new Error(`Failed to fetch text items: ${(error as Error).message}`);
    }
  }

  // Create a new Miro board
  async createBoard(name: string, description?: string, sharingPolicy?: any): Promise<any> {
    try {
      const payload: any = { name };
      if (description) payload.description = description;
      if (sharingPolicy) payload.policy = { sharingPolicy };
      const response = await axios.post(
        `${this.baseUrl}/boards`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Update item position or parent
  async updateItemPositionOrParent(boardId: string, itemId: string, position: { x: number, y: number }, parentId?: string): Promise<any> {
    try {
      const payload: any = { position };
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.patch(
        `${this.baseUrl}/boards/${boardId}/items/${itemId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Create a new frame on a board
  async createFrame(boardId: string, title: string, x: number, y: number, width: number, height: number): Promise<any> {
    try {
      const payload: any = {
        data: { title },
        position: { x, y },
        geometry: { width, height }
      };
      const response = await axios.post(
        `${this.baseUrl}/boards/${boardId}/frames`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Get a specific frame item
  async getFrame(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/boards/${boardId}/frames/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Update a specific frame item
  async updateFrame(boardId: string, itemId: string, data?: any, style?: any, geometry?: any): Promise<any> {
    try {
      const payload: any = {};
      if (data) payload.data = data;
      if (style) payload.style = style;
      if (geometry) payload.geometry = geometry;
      const response = await axios.patch(
        `${this.baseUrl}/boards/${boardId}/frames/${itemId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Delete a specific frame item
  async deleteFrame(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/boards/${boardId}/frames/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Create a new text item
  async createText(boardId: string, data: any, position: { x: number, y: number }, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = {
        type: 'text',
        data,
        position,
      };
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.post(
        `${this.baseUrl}/boards/${boardId}/items`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Get a specific text item
  async getTextItem(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/boards/${boardId}/texts/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Update a specific text item
  async updateText(boardId: string, itemId: string, data?: any, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = {};
      if (data) payload.data = data;
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.patch(
        `${this.baseUrl}/boards/${boardId}/texts/${itemId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Delete a specific text item
  async deleteText(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/boards/${boardId}/texts/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Create a new sticky note
  async createSticky(boardId: string, data: any, position: { x: number, y: number }, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = {
        data,
        position,
      };
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.post(
        `${this.baseUrl}/boards/${boardId}/sticky_notes`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Get a specific sticky note
  async getSticky(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/boards/${boardId}/sticky_notes/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Update a specific sticky note
  async updateSticky(boardId: string, itemId: string, data?: any, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = {};
      if (data) payload.data = data;
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.patch(
        `${this.baseUrl}/boards/${boardId}/sticky_notes/${itemId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Delete a specific sticky note
  async deleteSticky(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/boards/${boardId}/sticky_notes/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Share a board and invite members
  async shareBoard(boardId: string, members: Array<{ email: string, role: string, message?: string }>): Promise<any> {
    try {
      const payload = { members };
      const response = await axios.post(
        `${this.baseUrl}/boards/${boardId}/members`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Create a new card item
  async createCard(boardId: string, data: any, position: { x: number, y: number }, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = { data, position };
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.post(
        `${this.baseUrl}/boards/${boardId}/cards`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Get a specific card item
  async getCard(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/boards/${boardId}/cards/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Update a specific card item
  async updateCard(boardId: string, itemId: string, data?: any, style?: any, parentId?: string): Promise<any> {
    try {
      const payload: any = {};
      if (data) payload.data = data;
      if (style) payload.style = style;
      if (parentId) payload.parent = { id: parentId };
      const response = await axios.patch(
        `${this.baseUrl}/boards/${boardId}/cards/${itemId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // Delete a specific card item
  async deleteCard(boardId: string, itemId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/boards/${boardId}/cards/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Miro API error: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
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

    // Updated template categories to match miro-server.ts
    const templateCategories = {
      "workshops": {
        keywords: [
          "workshop", "facilitation", "meeting", "collaboration", "team building",
          "icebreaker", "session", "attendees", "participants", "discussion",
          "facilitated", "breakout", "group exercise", "team activity"
        ],
        weight: 0.9,
        semanticDescription: "Activities and structures for facilitating group sessions, team building, and collaborative work"
      },
      "brainstorming": {
        keywords: [
          "ideas", "creativity", "innovation", "brainstorm", "ideation", "concepts",
          "mind map", "creative thinking", "generate ideas", "explore options",
          "think outside", "creative session", "idea generation"
        ],
        weight: 1.0,
        semanticDescription: "Tools and frameworks for generating, organizing, and developing creative ideas"
      },
      "research": {
        keywords: [
          "research", "user research", "market research", "customer insights",
          "user experience", "ux", "design research", "user testing",
          "customer journey", "persona", "user feedback"
        ],
        weight: 1.0,
        semanticDescription: "Tools for conducting and organizing user research, market analysis, and design research"
      },
      "strategic_planning": {
        keywords: [
          "strategy", "planning", "roadmap", "business model", "goals",
          "objectives", "vision", "mission", "strategy planning",
          "business planning", "market analysis"
        ],
        weight: 1.0,
        semanticDescription: "Frameworks and tools for strategic business planning and analysis"
      },
      "agile": {
        keywords: [
          "sprint", "scrum", "agile", "retrospective", "standup", "backlog",
          "user stories", "kanban", "velocity", "story points", "sprint planning",
          "daily standup", "sprint review", "burndown", "epic", "feature"
        ],
        weight: 1.2,
        semanticDescription: "Tools and frameworks for agile project management and development"
      },
      "mapping": {
        keywords: [
          "mapping", "diagram", "flowchart", "process", "workflow",
          "swimlane", "stakeholder", "uml", "system", "architecture"
        ],
        weight: 1.0,
        semanticDescription: "Tools for creating various types of diagrams and visual maps"
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
}