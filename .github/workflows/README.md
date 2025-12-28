# GitHub Workflows

This repository uses GitHub Actions for CI/CD and automated code analysis.

## Workflows

### 1. CI (`ci.yml`)
- **Trigger:** Push/PR to `main`
- **Purpose:** Test application on Node.js 18.x and 20.x
- **Actions:** Install dependencies, verify server starts

### 2. Docker Build (`docker.yml`)
- **Trigger:** Push to `main`, tags, PRs
- **Purpose:** Build and publish Docker images
- **Output:** Images published to GitHub Container Registry (ghcr.io)

### 3. Claude Code Review (`claude-code-review.yml`)
- **Trigger:** Pull requests
- **Purpose:** Automated AI code review using Claude
- **Actions:** Reviews changed files and posts feedback as PR comment
- **Requires:** `ANTHROPIC_API_KEY` secret

### 4. Claude Code Analysis (`claude-code-analysis.yml`)
- **Trigger:** Push to `main`, manual dispatch
- **Purpose:** Deep codebase analysis and recommendations
- **Actions:** Creates/updates GitHub issue with analysis report
- **Requires:** `ANTHROPIC_API_KEY` secret

## Setup

### Required Secrets

Add these secrets to your repository: **Settings → Secrets and variables → Actions**

#### `ANTHROPIC_API_KEY`
Required for Claude workflows.

1. Get your API key from: https://console.anthropic.com/settings/keys
2. Add as repository secret named `ANTHROPIC_API_KEY`

### Enable Workflows

1. Go to **Actions** tab in your GitHub repository
2. Enable workflows if prompted
3. Workflows will run automatically based on their triggers

### Manual Workflow Dispatch

To run Claude Code Analysis manually:
1. Go to **Actions** tab
2. Select "Claude Code Analysis"
3. Click "Run workflow"

## Claude Workflow Features

### Code Review (`claude-code-review.yml`)
- Reviews all changed `.js`, `.html`, `.css`, `.md` files
- Provides feedback on:
  - Code quality
  - Potential bugs
  - Security concerns
  - Performance issues
  - Best practices
- Posts review as PR comment with actionable feedback

### Code Analysis (`claude-code-analysis.yml`)
- Analyzes entire codebase architecture
- Identifies:
  - Security vulnerabilities
  - Performance optimizations
  - Code quality improvements
  - Missing features
  - Technical debt
- Creates prioritized improvement list
- Updates single issue (labeled `claude-analysis`) on each run

## Cost Considerations

Claude API usage incurs costs:
- Code Review: ~$0.01-0.05 per PR (depending on size)
- Code Analysis: ~$0.05-0.10 per run

Monitor usage at: https://console.anthropic.com/settings/usage

## Customization

Edit workflow files to:
- Change Claude model (default: `claude-3-5-sonnet-20241022`)
- Adjust triggers
- Modify analysis prompts
- Add additional checks
