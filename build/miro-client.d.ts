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
export declare class MiroClient {
    private accessToken;
    private baseUrl;
    constructor(accessToken: string);
    private makeRequest;
    getBoardInfo(boardId: string): Promise<MiroBoardInfo>;
    getBoardContent(boardId: string): Promise<string[]>;
    private extractTextFromItem;
    getItemsByType(boardId: string, itemType: string): Promise<MiroItem[]>;
}
export declare class TemplateRecommendationEngine {
    private miroClient;
    constructor(accessToken: string);
    analyzeBoard(boardId: string): Promise<{
        content: string[];
        itemTypes: string[];
        boardInfo: MiroBoardInfo;
        keywords: string[];
        categories: string[];
        context: string;
    }>;
    private analyzeContentForKeywords;
    private generateContextDescription;
}
