# rpothin.github.io

A VS Code–themed developer blog built with Vite, React, TypeScript, and Tailwind CSS. All content is written in Markdown and rendered statically with Shiki syntax highlighting.

## Features

- **VS Code UI** – Activity Bar, Sidebar Explorer, Tab Bar, and Status Bar
- **Dark / Light theme** – Toggle with localStorage persistence
- **Shiki syntax highlighting** – Same engine VS Code uses, rendered at build time
- **Client-side search** – Powered by Lunr.js with a pre-built JSON index
- **Static output** – Fast CDN-friendly pages with minimal JavaScript

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 with VS Code theme variables |
| Markdown | markdown-it + @shikijs/markdown-it |
| Search | Lunr.js (pre-built index) |
| Routing | React Router (HashRouter) |
| Hosting | GitHub Pages via GitHub Actions |

## Getting Started

```bash
# Install dependencies
npm ci

# Build content (file tree, search index, rendered HTML)
npm run build:content

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Adding Content

1. Create a `.md` file under `content/posts/` with YAML frontmatter:

```markdown
---
title: My New Post
date: 2026-03-01
tags: [example, tutorial]
description: A short description of the post
---

# My New Post

Post content here…
```

2. Run `npm run build:content` (or `npm run build` which runs it automatically).

## Project Structure

```
├── content/              # Markdown source files
│   ├── about.md
│   └── posts/
├── scripts/
│   └── build-content.ts  # Generates file-tree, search index, rendered HTML
├── src/
│   ├── components/       # ActivityBar, Sidebar, FileExplorer, etc.
│   ├── hooks/            # useTheme, useSearch
│   ├── pages/            # HomePage, PostPage, AboutPage
│   └── types.ts
├── .devcontainer/        # Codespaces configuration
└── .github/workflows/    # CI/CD pipeline
```

## License

[MIT](LICENSE)
