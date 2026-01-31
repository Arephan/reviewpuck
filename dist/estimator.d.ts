/**
 * Size Estimator - Analyzes PR size and suggests splits
 *
 * Feature 1: Early Size Detection for DRAFT PRs
 */
import type { PRData, SizeEstimate, SplitSuggestion, Config } from './types.js';
import { ClaudeClient } from './anthropic.js';
/**
 * Estimate PR size and review complexity
 */
export declare function estimateSize(pr: PRData, config: Config): SizeEstimate;
/**
 * Use Claude to suggest how to split a large PR
 */
export declare function suggestSplits(pr: PRData, estimate: SizeEstimate, claude: ClaudeClient): Promise<SplitSuggestion[]>;
/**
 * Format size estimate as a GitHub comment
 */
export declare function formatSizeComment(estimate: SizeEstimate, splits: SplitSuggestion[] | null, prNumber: number): string;
