"use strict";
/**
 * Anthropic Claude API client wrapper
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class ClaudeClient {
    client;
    model;
    constructor(apiKey, model = 'claude-sonnet-4-20250514') {
        this.client = new sdk_1.default({ apiKey });
        this.model = model;
    }
    /**
     * Generate a completion with Claude
     */
    async complete(systemPrompt, userPrompt, options = {}) {
        const { maxTokens = 4096, temperature = 0.3 } = options;
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
    }
    /**
     * Parse JSON from Claude's response
     */
    async completeJSON(systemPrompt, userPrompt, options = {}) {
        const response = await this.complete(systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no explanation.', userPrompt, options);
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
        }
        else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
        }
        return JSON.parse(jsonStr.trim());
    }
}
exports.ClaudeClient = ClaudeClient;
//# sourceMappingURL=anthropic.js.map