/**
 * Label Manager - Handles PR labeling for split tracking
 *
 * Feature 4: Label-Based Priority System
 */
import { GitHubClient } from './github.js';
/**
 * Get size label based on line count
 */
export declare function getSizeLabel(lines: number): string;
/**
 * Add size label to a PR
 */
export declare function addSizeLabel(github: GitHubClient, prNumber: number, lines: number): Promise<void>;
/**
 * Add split tracking labels
 */
export declare function addSplitLabels(github: GitHubClient, prNumber: number, originalPrNumber: number, order: number, total: number): Promise<void>;
/**
 * Format the comment for a closed original PR that was split
 */
export declare function formatSplitClosedComment(originalPrNumber: number, splits: Array<{
    number: number;
    title: string;
    order: number;
}>): string;
/**
 * Ensure required labels exist in the repo
 */
export declare function ensureLabelsExist(github: GitHubClient, _owner: string, _repo: string): Promise<void>;
