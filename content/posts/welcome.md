---
title: Welcome to My Blog
date: 2026-02-06
tags: [blog, introduction, transition, ai, power-platform]
description: Starting a new chapter—moving from Medium to my own site and from Power Platform to AI-native software engineering
---

# Welcome to My Blog

Welcome — and thanks for being here.

This is the first post on my new, VS Code-themed software engineer blog, and it marks a pretty meaningful transition for me:

- **From Medium to my own website + blog**
- **From a Power Platform–centered focus to AI-native software engineering**

I started blogging on Medium in **December 2019**. Over the last five years I published **32 posts** — not a huge number, but I’m genuinely proud of them. They represent real learning, real time spent digging into details, and (the best part) real impact on the community.

Through that entire journey, my goals have stayed consistent:

- **Document my learnings first** (so future-me doesn’t have to rediscover the same things)
- **Share what I learn** (so others can move faster and build with more confidence)

## Why a VS Code Theme?

As software engineers, we spend a big chunk of our lives in editors. I wanted this site to feel like the environment where the work actually happens:

- **Syntax Highlighting**: Powered by Shiki, the same engine VS Code uses
- **File Explorer**: Navigate posts like files in an IDE
- **Dark/Light Mode**: Just like your editor preferences

More importantly, the theme matches the direction I’m taking: treating writing as part of engineering — versioned, iterative, and improved over time.

## A new home (and why now)

I’ve been thinking about moving away from Medium for a while.

Medium is convenient, and the built-in reach is real — those are hard benefits to give up. But I’ve also wanted a space that’s fully mine: a place where I can shape the experience, structure the content like a product, and evolve it over time without fighting a platform.

The catalyst was the last year of going deeper and deeper into using AI to enhance my day-to-day software engineering work.

At some point it clicked: building and maintaining my own site wasn’t “a big someday project” anymore. With the right tools (and the right mindset), it’s absolutely within reach — and it’s a great forcing function for learning.

This site is my proof to myself that “content + code” can be a single workflow.

## From Power Platform to AI-native software engineering

Power Platform has been a big part of my professional life, and I’m grateful for the community and opportunities that came with it.

My Trailblazer journey also nudged me toward topics that were either new, not well-documented, or full of sharp edges — which usually meant deep research and slower publishing. I _love_ that process… but I’ve also felt a pull to write more broadly:

- lessons learned building things
- opinions that changed over time
- career and craft
- systems, habits, and the messy realities of shipping

At the same time, I’m increasingly focused on **AI-native software engineering**: building software where AI isn’t a bolt-on feature, but a first-class part of how we design, implement, test, and operate systems.

That doesn’t mean I’m “done” with Power Platform content — it means I’m opening the aperture.

## A bit more about the tech stack behind the scenes

This blog is built as a static site using:

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** (v4) with VS Code-ish theme variables
- **Markdown-it** + **Shiki** for syntax highlighting
- **Lunr.js** for client-side full-text search (with a pre-built index)
- **GitHub Pages** for hosting

All content is written in Markdown and rendered at build time into static HTML (plus a generated file tree and search index). That’s the “website as code” part: posts are files, navigation is derived from structure, and everything can be reviewed like any other change.

## Code Example

Here’s a small TypeScript snippet that captures the spirit of this site — building an index from content (content-as-code):

```typescript
type PostMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
};

async function loadPostIndex(): Promise<PostMeta[]> {
  // Built at compile time from the markdown files.
  const res = await fetch("/posts-meta.json");
  if (!res.ok) throw new Error("Failed to load post index");
  return res.json() as Promise<PostMeta[]>;
}

const posts = await loadPostIndex();
console.log(`Loaded ${posts.length} posts`);
```

And some CSS:

```css
.vscode-theme {
  --background: #1e1e1e;
  --foreground: #d4d4d4;
  font-family: "Cascadia Code", monospace;
}
```

## What's Next?

I’m hoping this new home helps me **write more often**, iterate faster, and share more of what I’m learning — not just the polished “final tutorial,” but also the thinking that leads there.

Some themes I’m excited to write about next:

- AI-native engineering patterns (tooling, workflows, testing, reliability)
- shipping small things consistently (and what I learn along the way)
- software engineer experience, automation, and “docs as product”
- yes, still some Power Platform and GitHub topics — but with a wider lens

If you’ve read anything I wrote on Medium over the years: thank you. If you’re new here: welcome.

Let’s build.
