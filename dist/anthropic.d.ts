/**
 * Anthropic Claude API client wrapper
 */
export declare class ClaudeClient {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    /**
     * Generate a completion with Claude
     */
    complete(systemPrompt: string, userPrompt: string, options?: {
        maxTokens?: number;
        temperature?: number;
    }): Promise<string>;
    /**
     * Parse JSON from Claude's response
     */
    completeJSON<T>(systemPrompt: string, userPrompt: string, options?: {
        maxTokens?: number;
        temperature?: number;
    }): Promise<T>;
}
