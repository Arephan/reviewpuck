/**
 * Interactive Responder - Handles comment interactions
 *
 * Feature 3: Interactive Help Bot
 */
import type { PRData, CommentContext, PRSummary } from './types.js';
import { ClaudeClient } from './anthropic.js';
import { GitHubClient } from './github.js';
/**
 * Handle a comment and generate a response
 */
export declare function handleComment(context: CommentContext, pr: PRData, summary: PRSummary | null, claude: ClaudeClient): Promise<string>;
/**
 * Check if a comment should trigger a response
 */
export declare function shouldRespond(comment: CommentContext, botUsername: string): boolean;
/**
 * Process a comment and post response if appropriate
 */
export declare function processComment(context: CommentContext, pr: PRData, summary: PRSummary | null, claude: ClaudeClient, github: GitHubClient, botUsername: string): Promise<void>;
