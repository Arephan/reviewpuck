/**
 * Tests for size estimator
 */

import { describe, it, expect } from 'vitest';
import { estimateSize } from '../src/estimator.js';
import type { PRData, Config } from '../src/types.js';

const mockConfig: Config = {
  anthropicApiKey: 'test-key',
  githubToken: 'test-token',
  mode: 'auto',
  maxLines: 500,
  maxReadTimeMinutes: 10,
  model: 'claude-sonnet-4-20250514',
};

function createMockPR(overrides: Partial<PRData> = {}): PRData {
  return {
    number: 1,
    title: 'Test PR',
    body: 'Test description',
    draft: true,
    state: 'open',
    additions: 100,
    deletions: 50,
    changed_files: 5,
    files: [
      {
        filename: 'src/index.ts',
        status: 'modified',
        additions: 50,
        deletions: 25,
        changes: 75,
      },
      {
        filename: 'src/utils.ts',
        status: 'added',
        additions: 50,
        deletions: 25,
        changes: 75,
      },
    ],
    base: { ref: 'main', sha: 'abc123' },
    head: { ref: 'feature', sha: 'def456' },
    user: { login: 'testuser' },
    ...overrides,
  };
}

describe('estimateSize', () => {
  it('should estimate a small PR as OK', () => {
    const pr = createMockPR({ additions: 50, deletions: 20 });
    const estimate = estimateSize(pr, mockConfig);

    expect(estimate.totalLines).toBe(70);
    expect(estimate.isTooLarge).toBe(false);
    expect(estimate.recommendation).toBe('ok');
  });

  it('should flag a large PR as too large', () => {
    const pr = createMockPR({
      additions: 400,
      deletions: 200,
      files: [
        {
          filename: 'src/big-file.ts',
          status: 'modified',
          additions: 400,
          deletions: 200,
          changes: 600,
        },
      ],
    });
    const estimate = estimateSize(pr, mockConfig);

    expect(estimate.totalLines).toBe(600);
    expect(estimate.isTooLarge).toBe(true);
    expect(estimate.recommendation).toBe('warning');
  });

  it('should recommend split for very large PRs', () => {
    const pr = createMockPR({
      additions: 600,
      deletions: 300,
      files: [
        {
          filename: 'src/massive.ts',
          status: 'modified',
          additions: 600,
          deletions: 300,
          changes: 900,
        },
      ],
    });
    const estimate = estimateSize(pr, mockConfig);

    expect(estimate.totalLines).toBe(900);
    expect(estimate.recommendation).toBe('split-required');
  });

  it('should factor in language complexity', () => {
    // Rust file should have higher read time than JS
    const rustPR = createMockPR({
      additions: 100,
      deletions: 0,
      files: [
        {
          filename: 'src/main.rs',
          status: 'added',
          additions: 100,
          deletions: 0,
          changes: 100,
        },
      ],
    });

    const jsPR = createMockPR({
      additions: 100,
      deletions: 0,
      files: [
        {
          filename: 'src/main.js',
          status: 'added',
          additions: 100,
          deletions: 0,
          changes: 100,
        },
      ],
    });

    const rustEstimate = estimateSize(rustPR, mockConfig);
    const jsEstimate = estimateSize(jsPR, mockConfig);

    // Rust should have higher estimated read time due to complexity weight
    expect(rustEstimate.estimatedReadTimeMinutes).toBeGreaterThan(
      jsEstimate.estimatedReadTimeMinutes
    );
  });

  it('should account for file count in read time', () => {
    // Same lines, but spread across more files
    const fewFiles = createMockPR({
      additions: 100,
      deletions: 0,
      files: [
        { filename: 'a.ts', status: 'added', additions: 100, deletions: 0, changes: 100 },
      ],
    });

    const manyFiles = createMockPR({
      additions: 100,
      deletions: 0,
      files: [
        { filename: 'a.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
        { filename: 'b.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
        { filename: 'c.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
        { filename: 'd.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
        { filename: 'e.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
      ],
    });

    const fewEstimate = estimateSize(fewFiles, mockConfig);
    const manyEstimate = estimateSize(manyFiles, mockConfig);

    // More files = more context switching overhead
    expect(manyEstimate.estimatedReadTimeMinutes).toBeGreaterThan(
      fewEstimate.estimatedReadTimeMinutes
    );
  });
});

describe('cognitive complexity', () => {
  it('should rate simple PRs as low complexity', () => {
    const pr = createMockPR({
      additions: 50,
      deletions: 10,
      files: [
        { filename: 'README.md', status: 'modified', additions: 50, deletions: 10, changes: 60 },
      ],
    });
    const estimate = estimateSize(pr, mockConfig);

    expect(estimate.cognitiveComplexity).toBe('low');
  });

  it('should rate complex PRs appropriately', () => {
    const pr = createMockPR({
      additions: 700,
      deletions: 200,
      changed_files: 25,
      files: Array.from({ length: 25 }, (_, i) => ({
        filename: `src/file${i}.rs`,
        status: 'modified' as const,
        additions: 28,
        deletions: 8,
        changes: 36,
      })),
    });
    const estimate = estimateSize(pr, mockConfig);

    expect(['high', 'very-high']).toContain(estimate.cognitiveComplexity);
  });
});
