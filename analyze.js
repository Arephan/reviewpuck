#!/usr/bin/env node

/**
 * Analyze PR diff using Anthropic API
 * Usage: node analyze.js <diff-file>
 */

const fs = require('fs');
const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const diffFile = process.argv[2];
if (!diffFile) {
  console.error('Usage: node analyze.js <diff-file>');
  process.exit(1);
}

const diff = fs.readFileSync(diffFile, 'utf-8');

const prompt = `Analyze this code diff for CRITICAL issues only. Ignore style, linting, and obvious code.

ONLY report:
- Security vulnerabilities (SQL injection, XSS, auth bypass, secrets)
- Data loss/corruption risks
- Performance killers (N+1, memory leaks, infinite loops)
- Breaking changes in public APIs

For each issue, provide:
1. Severity: CRITICAL, HIGH, MEDIUM, or LOW
2. Type: Short label (e.g., "SQL Injection", "Memory Leak")
3. Location: file:line
4. Context: ONE line explaining impact (e.g., "public API, 1200 req/day")
5. Fix: Exact code to use (if possible in 1 line)

Format as JSON array:
[
  {
    "severity": "CRITICAL",
    "type": "SQL Injection",
    "file": "api/users.ts",
    "line": 42,
    "context": "public API, user-facing endpoint",
    "fix": "db.query('SELECT * FROM users WHERE id = ?', [userId])"
  }
]

If no critical issues, return: []

Diff:
${diff}`;

function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const response = await callAnthropic(prompt);
    const content = response.content[0].text;
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('[]');
      return;
    }
    
    const issues = JSON.parse(jsonMatch[0]);
    console.log(JSON.stringify(issues, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
