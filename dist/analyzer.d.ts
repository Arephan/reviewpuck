/**
 * Intent Analyzer - Groups PR changes by intent and creates summaries
 *
 * Feature 2: Smart PR Breakdown (Opus-Powered)
 */
import type { PRData, PRSummary } from './types.js';
import { ClaudeClient } from './anthropic.js';
/**
 * Analyze PR and group changes by intent using Claude
 */
export declare function analyzePR(pr: PRData, claude: ClaudeClient): Promise<PRSummary>;
/**
 * Format PR summary as a GitHub comment with clickable navigation
 */
export declare function formatSummaryComment(summary: PRSummary, prNumber: number): string;
