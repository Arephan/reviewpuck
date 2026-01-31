/**
 * Tests for interactive responder
 */

import { describe, it, expect } from 'vitest';
import { shouldRespond } from '../src/responder.js';
import type { CommentContext } from '../src/types.js';

function createMockComment(overrides: Partial<CommentContext> = {}): CommentContext {
  return {
    commentId: 1,
    body: 'what does this do?',
    user: 'reviewer',
    prNumber: 42,
    ...overrides,
  };
}

describe('shouldRespond', () => {
  const botUsername = 'github-actions[bot]';

  it('should respond to questions', () => {
    const comment = createMockComment({ body: 'what does this do?' });
    expect(shouldRespond(comment, botUsername)).toBe(true);
  });

  it('should respond to help requests', () => {
    expect(shouldRespond(createMockComment({ body: 'help' }), botUsername)).toBe(true);
    expect(shouldRespond(createMockComment({ body: '?' }), botUsername)).toBe(true);
  });

  it('should respond to why questions', () => {
    const comment = createMockComment({ body: 'why was this changed?' });
    expect(shouldRespond(comment, botUsername)).toBe(true);
  });

  it('should respond to suggestion requests', () => {
    const comment = createMockComment({ body: 'any suggestions for a better approach?' });
    expect(shouldRespond(comment, botUsername)).toBe(true);
  });

  it('should NOT respond to its own comments', () => {
    const comment = createMockComment({ user: botUsername, body: 'what does this do?' });
    expect(shouldRespond(comment, botUsername)).toBe(false);
  });

  it('should NOT respond to empty comments', () => {
    const comment = createMockComment({ body: '' });
    expect(shouldRespond(comment, botUsername)).toBe(false);
  });

  it('should NOT respond to general comments without keywords', () => {
    const comment = createMockComment({ body: 'LGTM' });
    expect(shouldRespond(comment, botUsername)).toBe(false);
  });

  it('should respond to short questions ending with ?', () => {
    const comment = createMockComment({ body: 'really?' });
    expect(shouldRespond(comment, botUsername)).toBe(true);
  });
});
