/**
 * Size Estimator - Analyzes PR size and suggests splits
 * 
 * Feature 1: Early Size Detection for DRAFT PRs
 */

import type { PRData, PRFile, SizeEstimate, SplitSuggestion, Config } from './types.js';
import { LANGUAGE_COMPLEXITY, DEFAULT_COMPLEXITY, BASE_READING_SPEED } from './types.js';
import { ClaudeClient } from './anthropic.js';

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get complexity weight for a file
 */
function getComplexityWeight(filename: string): number {
  const ext = getExtension(filename);
  return LANGUAGE_COMPLEXITY[ext] ?? DEFAULT_COMPLEXITY;
}

/**
 * Calculate weighted line count based on language complexity
 */
function calculateWeightedLines(files: PRFile[]): number {
  let weightedTotal = 0;

  for (const file of files) {
    const weight = getComplexityWeight(file.filename);
    weightedTotal += file.changes * weight;
  }

  return Math.round(weightedTotal);
}

/**
 * Estimate read time in minutes
 */
function estimateReadTime(files: PRFile[]): number {
  const weightedLines = calculateWeightedLines(files);
  const minutes = weightedLines / BASE_READING_SPEED;

  // Add overhead for context switching between files
  const fileSwitchOverhead = files.length * 0.5; // 30 seconds per file

  return Math.round(minutes + fileSwitchOverhead);
}

/**
 * Determine cognitive complexity level
 */
function determineCognitiveComplexity(
  files: PRFile[],
  totalLines: number
): SizeEstimate['cognitiveComplexity'] {
  const fileCount = files.length;
  const avgLinesPerFile = totalLines / Math.max(fileCount, 1);
  const maxComplexity = Math.max(...files.map((f) => getComplexityWeight(f.filename)));

  // Score factors
  let score = 0;

  // Large PRs are more complex
  if (totalLines > 800) score += 3;
  else if (totalLines > 500) score += 2;
  else if (totalLines > 200) score += 1;

  // Many files add complexity
  if (fileCount > 20) score += 3;
  else if (fileCount > 10) score += 2;
  else if (fileCount > 5) score += 1;

  // High language complexity adds to cognitive load
  if (maxComplexity > 1.4) score += 2;
  else if (maxComplexity > 1.1) score += 1;

  // Large individual files are harder
  if (avgLinesPerFile > 100) score += 2;
  else if (avgLinesPerFile > 50) score += 1;

  if (score >= 7) return 'very-high';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Estimate PR size and review complexity
 */
export function estimateSize(pr: PRData, config: Config): SizeEstimate {
  const totalLines = pr.additions + pr.deletions;
  const readTime = estimateReadTime(pr.files);
  const complexity = determineCognitiveComplexity(pr.files, totalLines);

  const isTooLarge =
    totalLines > config.maxLines || readTime > config.maxReadTimeMinutes;

  let recommendation: SizeEstimate['recommendation'] = 'ok';
  if (isTooLarge) {
    recommendation = totalLines > config.maxLines * 1.5 ? 'split-required' : 'warning';
  }

  return {
    totalLines,
    additions: pr.additions,
    deletions: pr.deletions,
    fileCount: pr.files.length,
    estimatedReadTimeMinutes: readTime,
    cognitiveComplexity: complexity,
    isTooLarge,
    recommendation,
  };
}

/**
 * Use Claude to suggest how to split a large PR
 */
export async function suggestSplits(
  pr: PRData,
  estimate: SizeEstimate,
  claude: ClaudeClient
): Promise<SplitSuggestion[]> {
  const systemPrompt = `You are a senior engineer helping split a large PR into smaller, reviewable chunks.

Your job is to analyze the PR diff and suggest logical splits based on:
1. INTENT - group changes by what they accomplish (auth, caching, UI, etc.)
2. DEPENDENCIES - ensure each split can be reviewed independently
3. SIZE - aim for 150-300 lines per split
4. REVIEWABILITY - each split should tell a coherent story

Return a JSON array of split suggestions.`;

  const fileList = pr.files
    .map((f) => `- ${f.filename} (+${f.additions}/-${f.deletions})`)
    .join('\n');

  const patches = pr.files
    .filter((f) => f.patch)
    .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch?.slice(0, 2000)}\n\`\`\``)
    .join('\n\n');

  const userPrompt = `# PR #${pr.number}: ${pr.title}

## Stats
- Total lines: ${estimate.totalLines}
- Files: ${estimate.fileCount}
- Estimated read time: ${estimate.estimatedReadTimeMinutes} min

## PR Description
${pr.body ?? 'No description provided'}

## Files Changed
${fileList}

## Diff Samples (truncated)
${patches.slice(0, 15000)}

---

Suggest how to split this PR into 2-5 smaller PRs. Each split should:
1. Have a clear name and purpose
2. List which files belong to it
3. Estimate its line range and read time
4. Include 2-4 bullet points describing what's in it

Return JSON in this format:
{
  "splits": [
    {
      "name": "Authentication Flow",
      "description": "Implements OAuth login with Google",
      "files": ["auth.ts", "login.tsx"],
      "lineRange": { "start": 1, "end": 200 },
      "estimatedReadTimeMinutes": 4,
      "bulletPoints": [
        "OAuth implementation",
        "Token refresh logic",
        "Logout endpoint"
      ]
    }
  ]
}`;

  const response = await claude.completeJSON<{ splits: SplitSuggestion[] }>(
    systemPrompt,
    userPrompt,
    { maxTokens: 2048 }
  );

  return response.splits;
}

/**
 * Format size estimate as a GitHub comment
 */
export function formatSizeComment(
  estimate: SizeEstimate,
  splits: SplitSuggestion[] | null,
  prNumber: number
): string {
  const emoji = estimate.recommendation === 'ok' ? '✅' : estimate.recommendation === 'warning' ? '⚠️' : '🚨';
  const status = estimate.recommendation === 'ok'
    ? 'Good size for review'
    : estimate.recommendation === 'warning'
    ? 'Consider splitting before review'
    : 'Split before marking Ready for review';

  let comment = `## ${emoji} PR Size Check

**${estimate.totalLines} lines** changed across **${estimate.fileCount} files**

| Metric | Value |
|--------|-------|
| Additions | +${estimate.additions} |
| Deletions | -${estimate.deletions} |
| Est. Read Time | ~${estimate.estimatedReadTimeMinutes} min |
| Cognitive Load | ${estimate.cognitiveComplexity} |

**Status:** ${status}
`;

  if (splits && splits.length > 0) {
    comment += `
---

### 📦 Suggested Splits

`;

    splits.forEach((split, i) => {
      comment += `#### ${i + 1}. **${split.name}** (~${split.estimatedReadTimeMinutes} min)

${split.description}

**Files:**
${split.files.map((f) => `- \`${f}\``).join('\n')}

**Includes:**
${split.bulletPoints.map((b) => `- ${b}`).join('\n')}

`;
    });

    comment += `
---

### After splitting, add these labels:

\`\`\`
split-from: #${prNumber}
review-order: 1/${splits.length}, 2/${splits.length}, etc.
\`\`\`
`;
  }

  return comment;
}
