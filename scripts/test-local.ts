#!/usr/bin/env npx tsx
/**
 * Local testing script for AI PR Helper
 * 
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/test-local.ts <owner> <repo> <pr-number>
 * 
 * Example:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/test-local.ts metalbear-co mirrord 1234
 */

import { Octokit } from '@octokit/rest';
import Anthropic from '@anthropic-ai/sdk';

const [owner, repo, prNumberStr] = process.argv.slice(2);

if (!owner || !repo || !prNumberStr) {
  console.error('Usage: npx tsx scripts/test-local.ts <owner> <repo> <pr-number>');
  process.exit(1);
}

const prNumber = parseInt(prNumberStr, 10);
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

if (!anthropicKey) {
  console.error('ANTHROPIC_API_KEY environment variable required');
  process.exit(1);
}

async function main() {
  console.log(`\n🦞 AI PR Helper - Local Test\n`);
  console.log(`Analyzing PR: ${owner}/${repo}#${prNumber}\n`);

  // Initialize clients
  const octokit = new Octokit({ auth: githubToken });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Fetch PR
  console.log('📥 Fetching PR data...');
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  console.log(`   Title: ${pr.title}`);
  console.log(`   State: ${pr.state} ${pr.draft ? '(draft)' : ''}`);
  console.log(`   Changes: +${pr.additions}/-${pr.deletions} in ${pr.changed_files} files`);

  // Fetch files
  console.log('\n📁 Fetching files...');
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  console.log(`   ${files.length} files retrieved`);

  // Calculate size estimate
  const totalLines = pr.additions + pr.deletions;
  const readTimeEst = Math.round(totalLines / 50 + files.length * 0.5);

  console.log('\n📊 Size Estimate:');
  console.log(`   Total lines: ${totalLines}`);
  console.log(`   Est. read time: ~${readTimeEst} min`);
  console.log(`   Status: ${totalLines > 500 ? '🚨 TOO LARGE' : totalLines > 300 ? '⚠️ Getting large' : '✅ Good size'}`);

  if (totalLines > 300) {
    console.log('\n🤖 Generating split suggestions with Claude...');

    const fileList = files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n');
    const patches = files
      .filter(f => f.patch)
      .slice(0, 10)
      .map(f => `### ${f.filename}\n\`\`\`diff\n${f.patch?.slice(0, 1000)}\n\`\`\``)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a senior engineer suggesting how to split a large PR. Group by INTENT, not file type. Be specific.`,
      messages: [{
        role: 'user',
        content: `# PR: ${pr.title}

## Description
${pr.body || 'No description'}

## Files (${files.length} total)
${fileList}

## Sample diffs
${patches}

---

Suggest 2-4 ways to split this PR. For each:
1. Name (e.g., "Authentication Flow")
2. Which files belong
3. Why it's a logical unit
4. Estimated size after split

Keep it concise.`
      }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      console.log('\n📦 Split Suggestions:\n');
      console.log(textBlock.text);
    }
  }

  // Generate summary
  console.log('\n🤖 Generating PR summary with Claude...');

  const fileList = files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n');
  const patches = files
    .filter(f => f.patch)
    .slice(0, 15)
    .map(f => `### ${f.filename}\n\`\`\`diff\n${f.patch?.slice(0, 1500)}\n\`\`\``)
    .join('\n\n');

  const summaryResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: `You are creating a reviewable summary of a PR. Group changes by INTENT. Create a scannable index.`,
    messages: [{
      role: 'user',
      content: `# PR: ${pr.title}

## Description
${pr.body || 'No description'}

## Files
${fileList}

## Diffs
${patches.slice(0, 20000)}

---

Create a summary with:
1. Quick navigation index (what changed, grouped by intent)
2. For each group: what, why, files, watch-outs
3. Any helpful ASCII diagrams

Format as markdown that would work as a GitHub comment.`
    }]
  });

  const summaryBlock = summaryResponse.content.find(b => b.type === 'text');
  if (summaryBlock && summaryBlock.type === 'text') {
    console.log('\n📋 PR Summary:\n');
    console.log('---');
    console.log(summaryBlock.text);
    console.log('---');
  }

  console.log('\n✅ Analysis complete!\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
