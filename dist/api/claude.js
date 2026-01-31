"use strict";
/**
 * Claude API wrapper for AI code review
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initClaudeClient = initClaudeClient;
exports.reviewCode = reviewCode;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let client = null;
/**
 * Initialize Claude client
 */
function initClaudeClient(apiKey) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error('ANTHROPIC_API_KEY is required');
    }
    client = new sdk_1.default({ apiKey: key });
}
/**
 * Get Claude client (throws if not initialized)
 */
function getClient() {
    if (!client) {
        throw new Error('Claude client not initialized. Call initClaudeClient first.');
    }
    return client;
}
/**
 * Review code with AI (language agnostic)
 */
async function reviewCode(code, filename, model = 'claude-sonnet-4-20250514') {
    const prompt = `You are an expert code reviewer. Review this code change from ${filename}.

CODE:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Analyze for:
1. **Language Detection** - Determine the programming language
2. **Code Quality Issues** - Any problems, anti-patterns, or concerns
3. **AI-Generated Patterns** - Signs this may be AI-generated (over-defensive, verbose, over-abstracted)
4. **Improvement Suggestions** - Actionable fixes

Respond in JSON format only:
{
  "language": "detected programming language",
  "summary": "1-2 sentence overview of what changed",
  "issues": [
    {
      "severity": "high|medium|low",
      "issue": "What's wrong (be specific)",
      "suggestion": "How to fix it (actionable)"
    }
  ]
}

Only report real issues. If the code looks good, return empty issues array.
Be specific and helpful, not generic or vague.`;
    const response = await getClient().messages.create({
        model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return defaultReview();
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            language: parsed.language || 'Unknown',
            summary: parsed.summary || 'Code changes detected',
            issues: Array.isArray(parsed.issues) ? parsed.issues : []
        };
    }
    catch (e) {
        console.error('Failed to parse AI response:', e);
        return defaultReview();
    }
}
function defaultReview() {
    return {
        language: 'Unknown',
        summary: 'Unable to analyze code',
        issues: []
    };
}
//# sourceMappingURL=claude.js.map