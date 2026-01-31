/**
 * GitHub API utilities
 */
import type { PRData, PRFile, CommentContext, ActionContext } from './types.js';
export declare class GitHubClient {
    private octokit;
    private owner;
    private repo;
    constructor(token: string, owner: string, repo: string);
    /**
     * Get full PR data including files
     */
    getPullRequest(prNumber: number): Promise<PRData>;
    /**
     * Get all files in a PR (handles pagination)
     */
    getPRFiles(prNumber: number): Promise<PRFile[]>;
    /**
     * Post a comment on a PR
     */
    postComment(prNumber: number, body: string): Promise<number>;
    /**
     * Update an existing comment
     */
    updateComment(commentId: number, body: string): Promise<void>;
    /**
     * Reply to a review comment (line-specific)
     */
    replyToReviewComment(prNumber: number, commentId: number, body: string): Promise<void>;
    /**
     * Get a specific comment's context
     */
    getCommentContext(commentId: number, prNumber: number): Promise<CommentContext>;
    /**
     * Add labels to a PR
     */
    addLabels(prNumber: number, labels: string[]): Promise<void>;
    /**
     * Remove a label from a PR
     */
    removeLabel(prNumber: number, label: string): Promise<void>;
    /**
     * Get existing bot comments on a PR
     */
    getBotComments(prNumber: number, botIdentifier: string): Promise<{
        id: number;
        body: string;
    }[]>;
    /**
     * Find or create a specific bot comment (upsert pattern)
     */
    upsertBotComment(prNumber: number, botIdentifier: string, body: string): Promise<number>;
}
/**
 * Parse action context from GitHub event
 */
export declare function parseActionContext(): ActionContext;
