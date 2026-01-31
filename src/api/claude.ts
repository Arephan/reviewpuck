/**
 * Claude API wrapper for AI code review
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export interface AIReview {
  summary: string;
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
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
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return defaultReview();
  }
}

function defaultReview(): AIReview {
  return {
    language: 'Unknown',
    summary: 'Unable to analyze code',
    issues: []
  };
}
