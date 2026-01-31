/**
 * Interactive Responder - Handles comment interactions
 * 
 * Feature 3: Interactive Help Bot
 */

import type { PRData, CommentContext, PRSummary } from './types.js';
import { ClaudeClient } from './anthropic.js';
import { GitHubClient } from './github.js';

/**
 * Detect what kind of help the user is asking for
 */
function detectIntent(comment: string): 'explain' | 'why' | 'suggest' | 'tests' | 'help' | 'unknown' {
  const lower = comment.toLowerCase().trim();

  if (lower === 'help' || lower === '?' || lower.includes('what can you')) {
    return 'help';
  }
  if (lower.includes('what does') || lower.includes('what is') || lower.includes('explain')) {
    return 'explain';
  }
  if (lower.includes('why') || lower.includes('reason') || lower.includes('purpose')) {
    return 'why';
  }
  if (lower.includes('suggest') || lower.includes('better') || lower.includes('alternative')) {
    return 'suggest';
  }
  if (lower.includes('test') || lower.includes('spec')) {
    return 'tests';
  }

  // Default to explain if it's a short question
  if (lower.endsWith('?') && lower.length < 50) {
    return 'explain';
  }

  return 'unknown';
}

/**
 * Generate help message
 */
function getHelpMessage(): string {
  return `Hey! I'm here to help you review this PR. Here's what I can do:

| Command | What it does |
|---------|-------------|
| **"what does this do?"** | Explain the specific code |
| **"why this change?"** | Show intent and context |
| **"suggest better approach"** | Alternative implementations |
| **"show me tests"** | Link to related test files |
| **"help"** | Show this message |

Just comment on any line and ask! 🦞`;
}

/**
 * Handle a comment and generate a response
 */
export async function handleComment(
  context: CommentContext,
  pr: PRData,
  summary: PRSummary | null,
  claude: ClaudeClient
): Promise<string> {
  const intent = detectIntent(context.body);

  if (intent === 'help') {
    return getHelpMessage();
  }

  if (intent === 'unknown') {
    // Don't respond to unrecognized comments (avoid spam)
    return '';
  }

  // Build context for Claude
  const systemPrompt = `You are a helpful code reviewer assistant. Your job is to explain code clearly and concisely.

Guidelines:
- Be direct and helpful
- Use code snippets and ASCII diagrams when helpful
- Reference line numbers when relevant
- Keep explanations focused and actionable
- Use markdown formatting
- Be conversational but professional`;

  const fileContext = context.path
    ? pr.files.find((f) => f.filename === context.path)
    : null;

  const summaryContext = summary
    ? `## PR Summary\n${summary.groups.map((g) => `- **${g.name}**: ${g.summary}`).join('\n')}`
    : '';

  let userPrompt = `# Context

## PR #${pr.number}: ${pr.title}
${pr.body ?? ''}

${summaryContext}

## User's Question
"${context.body}"

`;

  if (context.path && context.diffHunk) {
    userPrompt += `## Code Location
File: \`${context.path}\`
Line: ${context.line ?? 'N/A'}

\`\`\`diff
${context.diffHunk}
\`\`\`

`;
  }

  if (fileContext?.patch) {
    userPrompt += `## Full File Diff
\`\`\`diff
${fileContext.patch.slice(0, 5000)}
\`\`\`

`;
  }

  switch (intent) {
    case 'explain':
      userPrompt += `
Please explain what this code does. Be specific and reference the actual code.
Format:
1. Quick summary (1-2 sentences)
2. Step-by-step breakdown if complex
3. Why it matters in context of the PR`;
      break;

    case 'why':
      userPrompt += `
Explain WHY this change was made. Consider:
1. What problem does it solve?
2. What was the previous behavior (if apparent)?
3. How does it fit into the larger PR context?`;
      break;

    case 'suggest':
      userPrompt += `
The user wants suggestions for improvement. Consider:
1. Are there better patterns or approaches?
2. Any potential issues or edge cases?
3. Performance or readability improvements?

Be constructive and specific. Show code examples.`;
      break;

    case 'tests':
      userPrompt += `
Help the user find or understand tests for this code. Consider:
1. Are there existing tests in the PR?
2. What test files might be related?
3. What should be tested here?`;
      break;
  }

  const response = await claude.complete(systemPrompt, userPrompt, {
    maxTokens: 1500,
    temperature: 0.3,
  });

  return response;
}

/**
 * Check if a comment should trigger a response
 */
export function shouldRespond(comment: CommentContext, botUsername: string): boolean {
  // Don't respond to our own comments
  if (comment.user === botUsername) {
    return false;
  }

  // Don't respond to empty comments
  if (!comment.body.trim()) {
    return false;
  }

  // Respond to short questions or explicit help requests
  const lower = comment.body.toLowerCase().trim();
  const isQuestion = lower.endsWith('?');
  const isHelpRequest = lower === 'help' || lower === '?';
  const hasKeywords = ['what', 'why', 'how', 'explain', 'suggest', 'test'].some((k) =>
    lower.includes(k)
  );

  return isQuestion || isHelpRequest || hasKeywords;
}

/**
 * Process a comment and post response if appropriate
 */
export async function processComment(
  context: CommentContext,
  pr: PRData,
  summary: PRSummary | null,
  claude: ClaudeClient,
  github: GitHubClient,
  botUsername: string
): Promise<void> {
  if (!shouldRespond(context, botUsername)) {
    return;
  }

  const response = await handleComment(context, pr, summary, claude);

  if (!response) {
    return;
  }

  // Reply to the comment
  if (context.path && context.line) {
    // It's a review comment on a specific line
    await github.replyToReviewComment(pr.number, context.commentId, response);
  } else {
    // It's a general comment
    await github.postComment(pr.number, response);
  }
}
