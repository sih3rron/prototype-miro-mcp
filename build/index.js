#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// Miro template categories and their common use cases
const TEMPLATE_CATEGORIES = {
    "brainstorming": {
        keywords: ["ideas", "creativity", "innovation", "brainstorm", "ideation", "concepts"],
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
        keywords: ["plan", "roadmap", "timeline", "schedule", "strategy", "goals", "objectives"],
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
        keywords: ["sprint", "scrum", "agile", "retrospective", "standup", "backlog", "user stories"],
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
        keywords: ["design", "prototype", "wireframe", "ux", "ui", "user experience", "mockup"],
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
        keywords: ["analysis", "research", "data", "insights", "swot", "competitive", "market"],
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
        keywords: ["workshop", "facilitation", "meeting", "collaboration", "team building"],
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
    }
};
class MiroTemplateRecommenderServer {
    server;
    constructor() {
        this.server = new Server({
            name: "miro-template-recommender",
            version: "0.1.0",
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "recommend_miro_templates",
                    description: "Analyze Miro board content and recommend relevant Miro templates",
                    inputSchema: {
                        type: "object",
                        properties: {
                            boardId: {
                                type: "string",
                                description: "The Miro board ID to analyze"
                            },
                            maxRecommendations: {
                                type: "number",
                                description: "Maximum number of template recommendations (default: 5)",
                                default: 5
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
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case "recommend_miro_templates":
                    return this.recommendTemplates(request.params.arguments);
                case "get_board_analysis":
                    return this.analyzeBoardContent(request.params.arguments);
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        });
    }
    async getMiroBoardContent(boardId) {
        // In a real implementation, you would use the Miro API
        // For now, we'll simulate this with mock data
        // You would need to implement actual Miro API calls here
        // Mock implementation - replace with actual Miro API calls
        const mockContent = [
            "Sprint planning for Q2 2024",
            "User story: As a customer, I want to track my order",
            "Retrospective action items",
            "Design system components",
            "Market research findings",
            "Competitive analysis matrix",
            "Brainstorming session notes",
            "Product roadmap milestones"
        ];
        return mockContent;
    }
    analyzeContent(content) {
        const allText = content.join(" ").toLowerCase();
        const foundKeywords = [];
        const matchedCategories = [];
        // Analyze content against template categories
        for (const [category, categoryData] of Object.entries(TEMPLATE_CATEGORIES)) {
            const matchingKeywords = categoryData.keywords.filter(keyword => allText.includes(keyword.toLowerCase()));
            if (matchingKeywords.length > 0) {
                foundKeywords.push(...matchingKeywords);
                matchedCategories.push(category);
            }
        }
        // Generate context description
        const context = this.generateContextDescription(allText, matchedCategories);
        return {
            keywords: [...new Set(foundKeywords)],
            categories: matchedCategories,
            context
        };
    }
    generateContextDescription(text, categories) {
        const contexts = [];
        if (categories.includes("agile")) {
            contexts.push("Agile/Scrum methodology");
        }
        if (categories.includes("design")) {
            contexts.push("Design and UX work");
        }
        if (categories.includes("planning")) {
            contexts.push("Strategic planning");
        }
        if (categories.includes("brainstorming")) {
            contexts.push("Ideation and creativity");
        }
        if (categories.includes("analysis")) {
            contexts.push("Research and analysis");
        }
        if (categories.includes("workshops")) {
            contexts.push("Team collaboration and workshops");
        }
        return contexts.length > 0
            ? `Board appears to focus on: ${contexts.join(", ")}`
            : "General collaborative work";
    }
    async recommendTemplates(args) {
        try {
            const { boardId, maxRecommendations = 5 } = args;
            // Get board content
            const boardContent = await this.getMiroBoardContent(boardId);
            // Analyze content
            const analysis = this.analyzeContent(boardContent);
            // Generate recommendations
            const recommendations = [];
            for (const category of analysis.categories) {
                const categoryTemplates = TEMPLATE_CATEGORIES[category]?.templates || [];
                recommendations.push(...categoryTemplates.map((template) => ({
                    ...template,
                    category,
                    relevanceScore: this.calculateRelevanceScore(analysis.keywords, category)
                })));
            }
            // Sort by relevance and limit results
            const sortedRecommendations = recommendations
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, maxRecommendations);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            boardId,
                            analysis: {
                                detectedKeywords: analysis.keywords,
                                identifiedCategories: analysis.categories,
                                context: analysis.context
                            },
                            recommendations: sortedRecommendations.map(rec => ({
                                name: rec.name,
                                url: rec.url,
                                description: rec.description,
                                category: rec.category,
                                relevanceScore: rec.relevanceScore
                            }))
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error recommending templates: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
    async analyzeBoardContent(args) {
        try {
            const { boardId } = args;
            // Get board content
            const boardContent = await this.getMiroBoardContent(boardId);
            // Analyze content
            const analysis = this.analyzeContent(boardContent);
            return {
                content: [
                    {
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
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error analyzing board: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
    calculateRelevanceScore(keywords, category) {
        const categoryKeywords = TEMPLATE_CATEGORIES[category]?.keywords || [];
        const matches = keywords.filter(k => Array.from(categoryKeywords).map(x => x).includes(k)).length;
        return matches / categoryKeywords.length;
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Miro Template Recommender MCP server running on stdio");
    }
}
const server = new MiroTemplateRecommenderServer();
server.run().catch(console.error);
