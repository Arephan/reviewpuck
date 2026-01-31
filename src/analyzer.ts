/**
 * Intent Analyzer - Groups PR changes by intent and creates summaries
 * 
 * Feature 2: Smart PR Breakdown (Opus-Powered)
 */

import type { PRData, PRFile, IntentGroup, PRSummary } from './types.js';
import { ClaudeClient } from './anthropic.js';

/**
 * Analyze PR and group changes by intent using Claude
 */
export async function analyzePR(pr: PRData, claude: ClaudeClient): Promise<PRSummary> {
  const systemPrompt = `You are a senior code reviewer creating a navigable summary of a PR.

Your job is to:
1. Group changes by INTENT (what they accomplish, not file type)
2. Create clear, scannable summaries
3. Highlight things reviewers should watch out for
4. Generate helpful diagrams when appropriate

Each group should be independently understandable and help the reviewer navigate the PR.`;

  const fileList = pr.files
    .map((f) => `- ${f.filename} (+${f.additions}/-${f.deletions}): ${f.status}`)
    .join('\n');

  const patches = pr.files
    .filter((f) => f.patch)
    .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch}\n\`\`\``)
    .join('\n\n');

  const userPrompt = `# PR #${pr.number}: ${pr.title}

## PR Description
${pr.body ?? 'No description provided'}

## Files Changed (${pr.files.length} files, +${pr.additions}/-${pr.deletions})
${fileList}

## Full Diff
${patches.slice(0, 30000)}

---

Analyze this PR and group changes by their INTENT (not by file type).

For each group:
1. Give it an ID (lowercase-hyphenated, like "auth-flow")
2. Name it clearly
3. Write a one-sentence summary (what it does)
4. Explain WHY this change is needed
5. List the files involved
6. Identify things to watch out for during review
7. If helpful, include an ASCII diagram showing the flow

Return JSON in this format:
{
  "groups": [
    {
      "id": "auth-flow",
      "name": "Authentication Flow",
      "summary": "Adds OAuth login with Google",
      "reason": "Replace deprecated session-based auth",
      "files": ["auth.ts", "login.tsx", "api/oauth.ts"],
      "lineRange": { "start": 1, "end": 155 },
      "details": "Detailed explanation of what this code does...",
      "watchOutFor": [
        "Token refresh happens in background (useEffect line 78)",
        "Logout clears both cookie AND localStorage"
      ],
      "diagram": "User clicks Login\\n  ↓\\nOAuth redirect\\n  ↓\\nCallback + token\\n  ↓\\nStore cookie ✓"
    }
  ],
  "estimatedReadTimeMinutes": 8
}

Guidelines:
- Aim for 2-5 groups (don't over-fragment)
- If a group would be >200 lines, consider splitting it
- Make summaries actionable ("Adds X" not "Changes to X")
- Watch-outs should be specific, not generic`;

  const response = await claude.completeJSON<{
    groups: IntentGroup[];
    estimatedReadTimeMinutes: number;
  }>(systemPrompt, userPrompt, { maxTokens: 4096 });

  return {
    totalChanges: response.groups.length,
    estimatedReadTimeMinutes: response.estimatedReadTimeMinutes,
    groups: response.groups,
  };
}

/**
 * Format PR summary as a GitHub comment with clickable navigation
 */
export function formatSummaryComment(summary: PRSummary, prNumber: number): string {
  const header = `## 📋 PR Summary (${summary.totalChanges} changes, ~${summary.estimatedReadTimeMinutes} min)

`;

  // Navigation index
  let index = '### Quick Navigation\n\n';
  summary.groups.forEach((group, i) => {
    const lineInfo = group.lineRange
      ? ` (lines ${group.lineRange.start}-${group.lineRange.end})`
      : '';
    index += `${i + 1}. [**${group.name}**](#${group.id})${lineInfo}\n`;
    index += `   - ${group.summary}\n`;
    index += `   - Files: ${group.files.map((f) => `\`${f}\``).join(', ')}\n\n`;
  });

  // Detailed sections
  let details = '\n---\n\n### Details\n\n';
  summary.groups.forEach((group) => {
    details += `<details id="${group.id}">
<summary><strong>${getEmojiForGroup(group.name)} ${group.name}</strong></summary>

#### What
${group.summary}

#### Why
${group.reason}

#### Files
${group.files.map((f) => `- \`${f}\``).join('\n')}

#### Explanation
${group.details}

${group.diagram ? `#### Flow
\`\`\`
${group.diagram}
\`\`\`
` : ''}
${group.watchOutFor.length > 0 ? `#### ⚠️ Watch out for
${group.watchOutFor.map((w) => `- ${w}`).join('\n')}
` : ''}
</details>

`;
  });

  const footer = `
---

<sub>🦞 AI PR Helper | [What does this do?](#help) | Powered by Claude</sub>`;

  return header + index + details + footer;
}

/**
 * Get an emoji based on group name (heuristic)
 */
function getEmojiForGroup(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('auth')) return '🔐';
  if (lower.includes('api') || lower.includes('endpoint')) return '🔌';
  if (lower.includes('ui') || lower.includes('component')) return '🎨';
  if (lower.includes('test')) return '🧪';
  if (lower.includes('config') || lower.includes('setup')) return '⚙️';
  if (lower.includes('error') || lower.includes('handling')) return '🛡️';
  if (lower.includes('cache') || lower.includes('performance')) return '⚡';
  if (lower.includes('database') || lower.includes('db')) return '🗄️';
  if (lower.includes('log')) return '📝';
  if (lower.includes('security')) return '🔒';
  if (lower.includes('refactor')) return '♻️';
  if (lower.includes('fix') || lower.includes('bug')) return '🐛';
  if (lower.includes('feature')) return '✨';
  if (lower.includes('docs')) return '📚';
  return '📦';
}
