# Content creation

This site uses a **hybrid content creation approach** that pairs the [Ghostwriter for VS Code](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-ghostwriter) extension with a custom Copilot agent (`@content-ghostwriter`) for post-processing. The extension handles the creative phase (brainstorming, interviewing, drafting); the agent handles the mechanical phase (validation, formatting, link checking, build verification).

## Table of contents

- [Philosophy](#philosophy)
- [Prerequisites](#prerequisites)
- [End-to-end workflow](#end-to-end-workflow)
  - [Phase 1 — Generate a voice profile (one-time setup)](#phase-1--generate-a-voice-profile-one-time-setup)
  - [Phase 2 — Interview](#phase-2--interview)
  - [Phase 3 — Write a first draft](#phase-3--write-a-first-draft)
  - [Phase 4 — Iterate on the draft](#phase-4--iterate-on-the-draft)
  - [Phase 5 — Save to workspace](#phase-5--save-to-workspace)
  - [Phase 6 — Polish with the content-ghostwriter agent](#phase-6--polish-with-the-content-ghostwriter-agent)
  - [Phase 7 — Final review and publish](#phase-7--final-review-and-publish)
- [Tool reference](#tool-reference)
  - [Ghostwriter extension](#ghostwriter-extension)
  - [Content-ghostwriter agent](#content-ghostwriter-agent)
- [Frontmatter schema](#frontmatter-schema)
- [Ghostwriter file structure](#ghostwriter-file-structure)
- [Version control considerations](#version-control-considerations)
- [Tips](#tips)

---

## Philosophy

AI-assisted writing works best when the AI acts as an **interviewer**, not a ghostwriter. The goal is to draw out _your_ knowledge, experiences, and opinions through conversation, then organise that raw material into a polished draft. The result sounds like you — because the source material literally is you.

This approach solves three problems at once:

1. **Blank-page syndrome** — the interview removes the pressure of starting from scratch.
2. **Authentic voice** — the draft is built from your answers, not generated from thin air.
3. **Speed** — you can produce a structured first draft in a fraction of the time it would take to write from scratch, without sacrificing quality.

Background reading: [Ghostwriter for VS Code: your AI interviewer in your editor](https://www.eliostruyf.com/ghostwriter-code-ai-interviewer-editor/) by Elio Struyf.

---

## Prerequisites

| Requirement                                                                                                    | Notes                                                       |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **VS Code ≥ 1.108.1**                                                                                          | The extension requires this minimum version                 |
| **GitHub Copilot subscription**                                                                                | The extension uses the Copilot Chat API for all AI features |
| **GitHub Copilot extension**                                                                                   | Must be installed and signed in                             |
| **[Ghostwriter extension](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-ghostwriter)** | Install from the VS Code marketplace                        |
| **Node.js**                                                                                                    | Needed for the build pipeline (`npm run build:content`)     |

---

## End-to-end workflow

The workflow has seven phases. Phases 1 is a one-time setup; phases 2-7 repeat for each new post.

### Phase 1 — Generate a voice profile (one-time setup)

The voice profile teaches the AI what your writing sounds like so drafts match your natural style.

1. Open the Ghostwriter panel: `Ctrl+Shift+P` → `Ghostwriter: Open Ghostwriter`.
2. Click **Generate Voice**.
3. Select a Copilot model (e.g. GPT-4o).
4. Click **Generate Voice Profile**.
5. When prompted, select the `content/` folder — this gives the AI access to your published posts (both `posts/` and `archive/`) as writing samples.
6. The profile is saved to `.ghostwriter/voices/voice-YYYY-MM-DD.md`.
7. Review the generated profile and tweak anything that feels off.

> Regenerate your voice profile periodically (every few months or after a noticeable style shift) so it stays current.

### Phase 2 — Interview

1. Open the Ghostwriter panel.
2. Click **Start Interview**.
3. _(Optional)_ Select or create a custom interviewer agent in `.ghostwriter/interviewer/` to shape the interview style.
4. Select your preferred Copilot model.
5. The AI asks for your topic — give it a concise description.
6. A transcript file is created immediately in `.ghostwriter/transcripts/`.
7. Answer the AI's questions conversationally. Share examples, opinions, and code snippets.
8. Each Q&A pair is saved to the transcript in real-time (safe against crashes).
9. The AI will detect when the interview is complete.

> **Tip:** If an interview is interrupted, you can resume it: Start Interview → Resume Interview → select the existing transcript.

### Phase 3 — Write a first draft

1. In the Ghostwriter panel, click **Write Article**.
2. _(Optional)_ Select or create a writer agent in `.ghostwriter/writer/`.
3. Select the transcript from the previous step.
4. Select your voice profile from `.ghostwriter/voices/`.
5. Configure writing options:
   - **Style:** Conversational _(recommended for this blog)_
   - **Headings:** Enabled
   - **SEO:** Enabled if desired, with relevant keywords
   - **Frontmatter template** — use this template to match the site's schema:
     ```yaml
     ---
     title: ""
     date: ""
     tags: []
     description: ""
     ---
     ```
6. Select your Copilot model and click **Start Writing**.
7. Watch the draft stream in real-time.

### Phase 4 — Iterate on the draft

Instead of saving immediately, click **Iterate Draft** to enter Draft Iteration Mode:

1. The draft is saved to `.ghostwriter/drafts/` with the interview topic as the title.
2. Use the refinement input to improve the draft conversationally:
   - _"Make the intro more engaging"_
   - _"Add more technical depth to section 3"_
   - _"This sounds too formal, make it more conversational"_
3. Each refinement creates a new revision with full history.
4. Navigate between revisions with prev/next controls.
5. When satisfied, proceed to export.

> **Tip:** You can return to saved drafts anytime from the **My Drafts** card on the Ghostwriter home page.

### Phase 5 — Save to workspace

1. Click **Export** (from Draft Iteration Mode) or **Save Article** (from Writer Mode).
2. Save the file to `content/posts/` with a kebab-case filename (e.g. `my-new-post.md`).

If you configured workspace settings for default save location and filename template, the extension can do this automatically:

```json
{
  "vscode-ghostwriter.defaultSaveLocation": "content/posts",
  "vscode-ghostwriter.filenameTemplate": "{{slug}}.md"
}
```

### Phase 6 — Polish with the content-ghostwriter agent

This is where the custom `@content-ghostwriter` agent takes over. In Copilot Chat:

```
@content-ghostwriter Polish content/posts/my-new-post.md
```

The agent will:

1. **Validate frontmatter** — enforce the exact 4-field schema (`title`, `date`, `tags`, `description`), normalise tags to kebab-case, synthesise a description if missing.
2. **Remove duplicate heading** — if the body starts with a `#` heading that matches the title.
3. **Annotate code blocks** — add language hints matching the site's Shiki configuration.
4. **Format GitHub alerts** — convert prose-in-code-fences to `[!NOTE]`, `[!TIP]`, etc. where appropriate.
5. **Validate links** — check every external URL, update redirects, flag dead links.
6. **Check internal links** — verify referenced slugs exist.
7. **Review voice consistency** — if a voice profile exists, flag tone deviations (never silently rewrites).
8. **Build dry-run** — run `npm run build:content` and fix any errors.

See [`.github/agents/content-ghostwriter.agent.md`](../.github/agents/content-ghostwriter.agent.md) for the full agent specification.

### Phase 7 — Final review and publish

1. Review any `<!-- TODO: review — ... -->` or `<!-- VOICE: ... -->` comments the agent left behind.
2. Address or remove each comment.
3. Read through the post one last time.
4. Commit and push:

```bash
git add content/posts/my-new-post.md
git commit -m "feat(content): add post — my new post"
git push
```

---

## Tool reference

### Ghostwriter extension

|                 |                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**        | Ghostwriter for VS Code                                                                                                                                        |
| **Identifier**  | `eliostruyf.vscode-ghostwriter`                                                                                                                                |
| **Marketplace** | [marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-ghostwriter](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-ghostwriter) |
| **Source code** | [github.com/estruyf/vscode-ghostwriter](https://github.com/estruyf/vscode-ghostwriter)                                                                         |
| **Blog post**   | [Ghostwriter for VS Code: your AI interviewer in your editor](https://www.eliostruyf.com/ghostwriter-code-ai-interviewer-editor/)                              |
| **License**     | MIT                                                                                                                                                            |
| **Version**     | 0.0.9 (as of Feb 2026)                                                                                                                                         |
| **Requires**    | VS Code ≥ 1.108.1, GitHub Copilot subscription + extension                                                                                                     |

**Key modes:**

| Mode            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| Interview       | AI asks you questions about a topic; answers saved as a transcript |
| Writer          | Generates a draft from a transcript + optional voice file          |
| Draft Iteration | Conversational refinement loop with revision history               |
| Voice Generator | Analyses your existing writing to create a reusable style profile  |

### Content-ghostwriter agent

|             |                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| **File**    | `.github/agents/content-ghostwriter.agent.md`                                                                          |
| **Invoke**  | `@content-ghostwriter` in Copilot Chat                                                                                 |
| **Scope**   | `content/posts/` only                                                                                                  |
| **Purpose** | Post-processing: frontmatter validation, code annotation, alert formatting, link checking, voice review, build dry-run |

---

## Frontmatter schema

Every post in `content/posts/` must have exactly these four fields:

```yaml
---
title: "Post Title"
date: YYYY-MM-DD
tags: [lowercase-kebab-case, tag-two, tag-three]
description: "A 1-2 sentence synthesis of the post (not a copy of the opening paragraph)"
---
```

| Field         | Type         | Rules                                                                    |
| ------------- | ------------ | ------------------------------------------------------------------------ |
| `title`       | String       | Required. Keep original wording.                                         |
| `date`        | `YYYY-MM-DD` | Required. Publication date.                                              |
| `tags`        | Array        | 3-5 lowercase kebab-case strings.                                        |
| `description` | String       | 1-2 sentences. Used in RSS feed and metadata. Must be a genuine summary. |

Do **not** add additional fields like `draft`, `archived`, or `originalUrl` — those are only for archive posts.

---

## Ghostwriter file structure

The extension creates a `.ghostwriter/` folder in the workspace root:

```
.ghostwriter/
├── transcripts/     # Interview transcripts (.md) and session metadata (.json)
├── voices/          # Voice/style profiles (.md)
├── interviewer/     # Custom interviewer agent prompts (.md)
├── writer/          # Custom writer agent prompts (.md)
├── drafts/          # Draft iterations (.json) with revision history
└── attachments/     # Images captured during interviews and writing
```

---

## Version control considerations

Commit some `.ghostwriter/` contents to the repo for transparency and reproducibility; ignore the rest as working artifacts.

**Recommended `.gitignore` additions:**

```gitignore
# Ghostwriter — working artifacts (do not commit)
.ghostwriter/transcripts/
.ghostwriter/drafts/
.ghostwriter/attachments/

# Ghostwriter — reusable assets (commit these)
# .ghostwriter/voices/
# .ghostwriter/interviewer/
# .ghostwriter/writer/
```

This means `voices/`, `interviewer/`, and `writer/` folders **are** tracked in git, so your voice profile and custom agent prompts are version-controlled alongside the blog.

---

## Tips

- **Frontmatter template in Ghostwriter:** Set up the 4-field template once in Writer mode → Writing Options → Add Frontmatter Template. It persists across sessions.
- **Save location settings:** Configure `vscode-ghostwriter.defaultSaveLocation` and `vscode-ghostwriter.filenameTemplate` in workspace settings so articles land in `content/posts/` automatically.
- **Voice profile refresh:** Regenerate your voice profile every few months, or after writing several new posts, so the AI stays calibrated to your current style.
- **Interviewer agents:** Create custom interviewer prompts in `.ghostwriter/interviewer/` for different content types (tutorials, opinion pieces, deep dives).
- **Writer agents:** Similarly, create writer prompts in `.ghostwriter/writer/` tuned to specific formats.
- **Images:** See [`images.md`](./images.md) for how to add images to posts. The Ghostwriter extension can attach images during interviews/writing, but you may need to move them to the correct `public/content/posts/<slug>/` folder before publishing.
- **Quick manual posts:** The hybrid workflow is recommended, but you can always write a post by hand in Markdown and run `@content-ghostwriter` to validate it — the agent handles any source, not just Ghostwriter output.
