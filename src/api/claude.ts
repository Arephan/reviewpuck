/**
 * Claude API wrapper for AI code review
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export interface AIReview {
  summary: string;      // 1 sentence: what is this PR
  critical: Array<{
    type: 'security' | 'crash' | 'data-loss' | 'performance';
    line: number;
    issue: string;      // Brief description
    friendlySuggestion: string;  // Polite, helpful suggestion for inline comment
  }>;
  language: string;
}

/**
 * Initialize Claude client
 */
export function initClaudeClient(apiKey?: string): void {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  client = new Anthropic({ apiKey: key });
}

/**
 * Get Claude client (throws if not initialized)
 */
function getClient(): Anthropic {
  if (!client) {
    throw new Error('Claude client not initialized. Call initClaudeClient first.');
  }
  return client;
}

/**
 * Review code with AI (language agnostic)
 */
export async function reviewCode(
  code: string,
  filename: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<AIReview> {
  const prompt = `You're a friendly code reviewer helping a teammate. Review this PR kindly.

CODE (${filename}):
\`\`\`
${code.slice(0, 4000)}
\`\`\`

ONLY report CRITICAL issues that could break production:
- 🔒 Security vulnerabilities (exposed secrets, SQL injection, XSS)
- 💥 Will crash (unhandled errors, null refs, race conditions)
- 🗑️ Data loss risks (missing validation, destructive ops)
- 🐌 Major performance problems (N+1 queries, infinite loops, memory leaks)

Ignore: style, minor optimizations, naming, comments, anything non-critical.

Respond in JSON:
{
  "language": "language name",
  "summary": "Factual summary of what this PR does. Use short, declarative sentences. State what it adds, what it changes, what functionality it provides, and what it doesn't include. Mention risk level if relevant (high-risk changes, low-risk refactor, etc.). Be neutral and technical. 3-5 sentences.",
  "critical": [
    {
      "type": "security|crash|data-loss|performance",
      "line": line_number_where_issue_is,
      "issue": "Brief what's wrong (1 sentence)",
      "friendlySuggestion": "A friendly, polite suggestion for how to fix it. Write like you're helping a teammate - encouraging and specific. 1-2 sentences max."
    }
  ]
}

Be encouraging and helpful in your summary. If no CRITICAL issues, return empty critical array.`;

  const response = await getClient().messages.create({
    model,
    max_tokens: 800,
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
      summary: parsed.summary || 'Code changes',
      critical: Array.isArray(parsed.critical) ? parsed.critical : []
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return defaultReview();
  }
}

function defaultReview(): AIReview {
  return {
    language: 'Unknown',
    summary: 'Unable to analyze',
    critical: []
  };
}
