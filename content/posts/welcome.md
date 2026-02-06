---
title: Welcome to My Blog
date: 2026-02-06
tags: [blog, introduction]
description: A first post introducing this VS Code-themed developer blog
---

# Welcome to My Blog

Welcome! This is the first post on my VS Code-themed developer blog.

## Why a VS Code Theme?

As developers, we spend most of our time in code editors. This blog brings that familiar experience to the web:

- **Syntax Highlighting**: Powered by Shiki, the same engine VS Code uses
- **File Explorer**: Navigate posts like files in an IDE
- **Dark/Light Mode**: Just like your editor preferences

## Code Example

Here's a TypeScript example to show off the syntax highlighting:

```typescript
interface BlogPost {
  title: string;
  date: string;
  tags: string[];
  content: string;
}

async function fetchPosts(): Promise<BlogPost[]> {
  const response = await fetch('/api/posts');
  return response.json();
}

const posts = await fetchPosts();
console.log(`Found ${posts.length} posts`);
```

And some CSS:

```css
.vscode-theme {
  --background: #1e1e1e;
  --foreground: #d4d4d4;
  font-family: 'Cascadia Code', monospace;
}
```

## What's Next?

Stay tuned for more posts about Power Platform, GitHub Actions, and developer tools!
