# Content Quality Standards Reference

Detailed rules for all Markdown content on this developer blog. This is the canonical reference used by both **preparation mode** (load before writing) and **review mode** (validate after writing).

## Contents

- [Frontmatter](#frontmatter)
- [First Heading](#first-heading)
- [Code Blocks](#code-blocks)
- [GitHub Alerts](#github-alerts)
- [Link Validation](#link-validation)
- [Slug Naming](#slug-naming)
- [Media](#media)

---

## Frontmatter

Two schemas exist depending on content type.

### New posts (`content/posts/`)

```yaml
---
title: "Post Title"
date: YYYY-MM-DD
tags: [tag-one, tag-two, tag-three]
description: "1-2 sentence synthesis of the post."
---
```

Exactly these four fields. No extras (`draft`, `archived`, `originalUrl`).

### Archive posts (`content/archive/`)

```yaml
---
title: "Post Title"
date: YYYY-MM-DD
tags: [tag-one, tag-two, tag-three]
description: "1-2 sentence synthesis of the post."
archived: true
originalUrl: "https://medium.com/rapha%C3%ABl-pothin/<slug>"
---
```

Six fields. `archived` is always `true`. `originalUrl` links to the original Medium publication.

### Field rules

| Field         | Type         | Rules                                                                |
| ------------- | ------------ | -------------------------------------------------------------------- |
| `title`       | String       | Keep the author's wording. Only fix typographical errors.            |
| `date`        | `YYYY-MM-DD` | Publication date. For new posts, use today if missing.               |
| `tags`        | Array        | 3–5 items, lowercase kebab-case. Infer from content if missing.      |
| `description` | String       | 1–2 sentences. Genuine synthesis — never copy the opening paragraph. |
| `archived`    | Boolean      | Archive only. Always `true`.                                         |
| `originalUrl` | String       | Archive only. Medium URL for the original post.                      |

## First Heading

Remove the first `# heading` from the body if it duplicates the `title` field. The site renders the title from frontmatter — a duplicate heading causes double rendering.

## Code Blocks

### Classify before annotating

Every bare ` ``` ` block must be classified:

**Code** — contains programming syntax, CLI commands, config, or structured data (JSON, YAML, XML). Add the appropriate language tag.

**Prose** — plain-English text the author put in a code fence for emphasis (option lists, notes, warnings). Convert to proper Markdown: a GitHub alert (see below), a bullet list, or a plain paragraph.

### Supported languages

These languages are registered in the site's Shiki highlighter ([build-content.ts](../../../../scripts/build-content.ts)):

`typescript`, `javascript`, `css`, `yaml`, `json`, `html`, `markdown`, `bash`, `dax`, `csharp`, `powershell`, `bicep`, `hcl`, `sql`

If the language is genuinely ambiguous, leave the block unannotated rather than guessing wrong.

## GitHub Alerts

Use [GitHub-style alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts) when the content genuinely fits. Do not force alerts where a plain paragraph or list reads better.

| Alert            | Colour | Use for                                        |
| ---------------- | ------ | ---------------------------------------------- |
| `> [!NOTE]`      | Blue   | Supplementary information                      |
| `> [!TIP]`       | Green  | Best practices, helpful shortcuts              |
| `> [!IMPORTANT]` | Purple | Prerequisites, critical context                |
| `> [!WARNING]`   | Amber  | Potential pitfalls, things that could go wrong |
| `> [!CAUTION]`   | Red    | Dangerous or irreversible actions              |

### Converting prose-in-code-fences

Medium authors and draft tools often abuse code blocks as visual callouts. Map them to the appropriate construct:

| Prose block type           | Convert to                   |
| -------------------------- | ---------------------------- |
| Warning / important note   | `> [!WARNING]` alert         |
| Informational note / aside | `> [!NOTE]` alert            |
| Tip or best practice       | `> [!TIP]` alert             |
| Critical prerequisite      | `> [!IMPORTANT]` alert       |
| Dangerous / irreversible   | `> [!CAUTION]` alert         |
| List of options or values  | Regular Markdown bullet list |
| Example narration          | Plain paragraph              |

## Link Validation

Check every external URL. Apply the appropriate action based on the result:

| Result                           | Action                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **200 OK**                       | Keep as-is.                                                                                                 |
| **Permanent redirect** (301/308) | Update URL silently to the final destination. Do not change anchor text.                                    |
| **404 / Gone / unreachable**     | Remove link markup, keep anchor text as plain text. Add `<!-- TODO: review — dead link removed: <url> -->`. |
| **Soft 404**                     | Treat as 404.                                                                                               |
| **Timeout / network error**      | Keep link. Add `<!-- TODO: review — link could not be verified: <url> -->`.                                 |

When multiple links share the same redirect pattern (e.g. `docs.microsoft.com` → `learn.microsoft.com`), verify a sample then apply in bulk.

## Slug Naming

- Lowercase kebab-case.
- Strip date prefixes (`YYYYMMDD_`).
- Convert underscores and spaces to hyphens.
- Remove trailing special characters.

Examples: `20210804_Tracking_changes_in_open_source_projects.md` → `tracking-changes-in-open-source-projects`, `My New Post Title` → `my-new-post-title`.

## Media

### Images

See [docs/images.md](../../../../docs/images.md) for full rules. Key points:

- Store in `public/content/posts/<slug>/` (not under `content/`).
- Reference with absolute paths: `/content/posts/<slug>/filename.png`.
- Alt text is required: meaningful, 5–20 words.

### Videos

See [docs/videos.md](../../../../docs/videos.md) for full rules. Key points:

- Wrap in `<div class="video-container">`.
- Use `https://www.youtube-nocookie.com/embed/<ID>` (privacy-enhanced).
- `title` attribute required on every iframe.
