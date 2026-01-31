# GitHub App Setup for ReviewMate 🐻

## Step 1: Create the App

**Go to:** https://github.com/settings/apps/new

**Copy these values:**

### Basic Information
- **GitHub App name:** `ReviewMate`
- **Description:** `AI-powered PR reviewer with inline comments and security analysis`
- **Homepage URL:** `https://github.com/Arephan/ai-pr-helper-v2`
- **Callback URL:** (leave empty)
- **Setup URL:** (leave empty)
- **Webhook:** Uncheck "Active"

### Permissions

**Repository permissions:**
- **Contents:** Read-only
- **Issues:** Read and write
- **Pull requests:** Read and write

**Organization permissions:** (none needed)

**Account permissions:** (none needed)

### Subscribe to events
- [x] Pull request
- [x] Pull request review comment
- [x] Issue comment

### Where can this GitHub App be installed?
- ○ Only on this account

---

## Step 2: After Creating

1. **Note down the App ID** (shown on the app's page)
2. **Generate a private key:**
   - Scroll down to "Private keys"
   - Click "Generate a private key"
   - Save the `.pem` file to `~/.github/reviewmate.pem`
3. **Install the app:**
   - Click "Install App" in the left sidebar
   - Select `Arephan/ai-pr-helper-test`
   - Choose "All repositories" or select specific repos
   - Click "Install"

---

## Step 3: Update Workflow

Once you have:
- App ID (e.g., `123456`)
- Private key file (`reviewmate.pem`)
- Installation ID (shown after installing)

Run this command:

```bash
cd /Users/hankim/clawd/ai-pr-helper-v2
cat > .github/workflows/update-for-app.sh << 'EOF'
#!/bin/bash
APP_ID="$1"
INSTALLATION_ID="$2"

# Add secrets to test repo
gh secret set REVIEWMATE_APP_ID --body "$APP_ID" -R Arephan/ai-pr-helper-test
gh secret set REVIEWMATE_PRIVATE_KEY --body "$(cat ~/.github/reviewmate.pem)" -R Arephan/ai-pr-helper-test
gh secret set REVIEWMATE_INSTALLATION_ID --body "$INSTALLATION_ID" -R Arephan/ai-pr-helper-test

echo "✅ Secrets added!"
EOF

chmod +x .github/workflows/update-for-app.sh
```

Then run:
```bash
./.github/workflows/update-for-app.sh <APP_ID> <INSTALLATION_ID>
```

---

## Step 4: Update Action Code

I'll update the action to support GitHub App authentication automatically.

---

## Bear Icon

Upload `bear-icon.png` (generated below) as the app's logo.
