# 🔍 ReviewPal

**AI-powered code review for any language.**

> Let Claude review your code changes and catch issues before your teammates do.

## ⏱️ Quick Start (2 minutes)

1. **Add workflow file** to your repo:

```bash
mkdir -p .github/workflows
curl -o .github/workflows/reviewpal.yml \
  https://raw.githubusercontent.com/Arephan/reviewpal/main/examples/github-action-workflow.yml
```

2. **Add your Anthropic API key:**
   - Go to repo Settings → Secrets → Actions
   - Add `ANTHROPIC_API_KEY` with your key
   - Get a key at: https://console.anthropic.com

3. **Create a PR** and watch ReviewPal analyze it! 🎉

---

## What It Does

ReviewPal uses Claude AI to:
- ✅ **Detect the language** automatically (Python, JS, Go, Rust, Java, etc.)
- ✅ **Find code quality issues** - bugs, anti-patterns, security concerns
- ✅ **Spot AI-generated patterns** - over-defensive code, verbose comments, over-abstraction
- ✅ **Give actionable suggestions** - specific fixes, not vague advice

**Language agnostic** - works with any programming language!

---

## Example Output

```markdown
## 🔍 ReviewPal

### 📄 `src/api/users.ts`

<details>
<summary>Lines 45-89</summary>

**Language:** TypeScript

**Summary:** Added user authentication with token validation and error handling.

**Issues Found:**

🟡 **Excessive try-catch nesting (4 levels deep)**
💡 *Fix:* Use a single try-catch at the function boundary. Let errors bubble up naturally.

🟡 **Missing input validation before database query**
💡 *Fix:* Add schema validation using zod or joi before the database call.

🟢 **Consider using a constant for the token expiry time**
💡 *Fix:* Move magic number 3600 to a named constant: TOKEN_EXPIRY_SECONDS

</details>
```

---

## Installation

### GitHub Action (Recommended)

```yaml
name: ReviewPal
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: ReviewPal
        uses: Arephan/reviewpal@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### CLI

```bash
npm install -g reviewpal

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Review staged changes
reviewpal

# Review a git range
reviewpal --git HEAD~3..HEAD

# Pipe from git
git diff main..feature | reviewpal -
```

---

## Configuration

### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `anthropic_api_key` | **Required** - Your Anthropic API key | - |
| `max_hunks` | Max code blocks to analyze | 20 |
| `model` | Claude model to use | claude-sonnet-4-20250514 |
| `comment_on_pr` | Post as PR comment | true |

### CLI Options

```bash
reviewpal --help

Options:
  -g, --git <range>     Git diff range (e.g., HEAD~3..HEAD)
  -f, --format <type>   Output: friendly, json
  -m, --max-hunks <n>   Max hunks to analyze (default: 20)
  --model <name>        Claude model (default: claude-sonnet-4-20250514)
  -q, --quiet           Minimal output
```

---

## Supported Languages

**All of them!** 🌍

ReviewPal uses Claude AI to understand any programming language:
- JavaScript, TypeScript, Python, Java, Go, Rust, C++, C#, Ruby, PHP, Kotlin, Swift...
- Even SQL, YAML, Dockerfile, shell scripts, and more

Claude automatically detects the language and applies appropriate review standards.

---

## How It Works

1. **Parse** the git diff into code changes
2. **Send to Claude** with context about the file and change
3. **AI analyzes** for:
   - Language detection
   - Code quality issues
   - AI-generated patterns
   - Improvement opportunities
4. **Format** results as friendly PR comments

---

## Why ReviewPal?

**Problem:** AI-generated code is hard to review
- Over-defensive (try-catch everywhere)
- Over-verbose (obvious comments)
- Over-engineered (unnecessary abstractions)

**Solution:** Let AI review AI-generated code
- Catches patterns humans miss
- Works with any language
- Gives specific, actionable feedback
- Fast and consistent

---

## Development

```bash
# Clone
git clone https://github.com/Arephan/reviewpal
cd reviewpal

# Install
npm install

# Build
npm run build

# Test locally
export ANTHROPIC_API_KEY=sk-ant-...
node dist/index.js --git HEAD~1
```

---

## API Key Safety

Your `ANTHROPIC_API_KEY` is:
- ✅ Stored in GitHub Secrets (encrypted)
- ✅ Only accessible to your workflows
- ✅ Never logged or exposed in output
- ✅ Can be rotated anytime at console.anthropic.com

---

## Cost

ReviewPal uses Claude Sonnet 4 by default (~$3 per million tokens).

**Typical usage:**
- Small PR (100 lines): ~$0.01
- Medium PR (500 lines): ~$0.05  
- Large PR (2000 lines): ~$0.20

Set `max_hunks` to control costs on massive PRs.

---

## Contributing

PRs welcome! Keep it:
1. Language agnostic
2. Actionable (not vague)
3. Friendly in tone

---

## License

MIT

---

**Made with Claude, for reviewing code written by Claude.** 🤖
