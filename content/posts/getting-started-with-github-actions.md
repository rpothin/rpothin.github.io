---
title: Getting Started with GitHub Actions
date: 2026-02-05
tags: [github, ci-cd, automation]
description: A beginner's guide to GitHub Actions for automating your workflow
---

# Getting Started with GitHub Actions

GitHub Actions is a powerful CI/CD platform that lets you automate your build, test, and deployment pipeline.

## Your First Workflow

Create a file at `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## Key Concepts

### Triggers

Workflows can be triggered by various events:

```yaml
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:       # Manual trigger
```

### Jobs and Steps

Jobs run in parallel by default. Use `needs` for sequential execution:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run deploy
```

## Best Practices

1. **Cache dependencies** to speed up builds
2. **Use specific action versions** (e.g., `@v4` not `@latest`)
3. **Store secrets** in GitHub Settings, never in code
4. **Keep workflows focused** - one workflow per concern

Happy automating!
