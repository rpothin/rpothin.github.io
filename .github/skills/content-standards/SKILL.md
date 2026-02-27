---
name: content-standards
description: "Content quality standards for this developer blog. Two modes: preparation (load standards before writing content) and review (validate content via sub-agent after writing). Covers frontmatter schemas, code-block annotation, GitHub alerts, link validation, slug naming, media rules, and confidence thresholds. Use when creating, polishing, reviewing, or migrating Markdown content under content/posts/ or content/archive/."
---

# Content Standards

This skill provides two modes for ensuring content quality on this developer blog. Both the `content-ghostwriter` and `migration-ghostwriter` agents use it. It is also available via `/content-standards` for manual content work.

## Modes

### Preparation mode

Load the detailed standards **before** generating or transforming content so that your output is aligned from the start.

**Action:** Read [references/quality-standards.md](references/quality-standards.md) and apply every rule during content creation.

### Review mode

Validate content **after** writing, when you consider it ready for review. Spin up a review sub-agent to get structured, unbiased feedback without polluting your own context with review logic.

**When to trigger:** After completing your content pass and before presenting the final summary to the author — but only if you believe the content is in a publishable state. If you are still iterating on structural issues, defer the review until the next stable draft.

**Action:** Invoke a sub-agent with the prompt template below.

## Procedure (quick reference)

Apply these checks in order when creating or polishing a Markdown file. Full details for each rule are in [references/quality-standards.md](references/quality-standards.md).

1. **Validate frontmatter** — enforce the correct schema (new-post or archive).
2. **Remove duplicate first heading** — if the body starts with a `#` that matches the title.
3. **Classify and annotate code blocks** — distinguish code from prose-in-fences; add language tags or convert to alerts/lists.
4. **Format GitHub alerts** — convert callout-style content to `[!NOTE]`, `[!TIP]`, etc. where it genuinely fits.
5. **Validate links** — check every external URL; update redirects, remove dead links.
6. **Verify slug and media conventions** — confirm naming and image/video references follow the rules.

After each step, briefly note what changed (or that nothing was needed). Use the [Confidence Threshold](#confidence-threshold) throughout to decide whether to proceed, flag for review, or ask the user.

## Review Sub-Agent

### Prompt template

When invoking the review sub-agent, use this prompt — replace `<file-path>` and `<context-notes>` with actual values:

```
You are a content quality reviewer for a developer blog.

1. Read the quality standards at `.github/skills/content-standards/references/quality-standards.md`.
2. Read the content file at `<file-path>`.
3. For each rule category in the standards (Frontmatter, First Heading, Code Blocks, GitHub Alerts, Link Validation, Slug Naming, Media), report one of:
   - **pass** — rule fully satisfied
   - **fail** — with specific issues and line references
   - **not-applicable** — rule does not apply to this content
4. At the end, provide a summary: total passes, total fails, and a recommended next action (publish, revise, or escalate to author).

Do not make edits to any file. Return only the structured review report.

Context notes from the calling agent:
<context-notes>
```

### Context notes guidance

Pass a brief note to the review sub-agent so it does not flag intentional choices as issues. Examples:

- "3 `<!-- TODO: review -->` comments were left intentionally for author review."
- "No voice profile exists; voice consistency was skipped."
- "Images were deliberately removed per migration rules (archived post)."

### Handling the review report

When the sub-agent returns its report:

1. **All pass** — proceed to the final summary for the author.
2. **Failures found** — fix each reported issue, then re-run the review (max 2 review cycles to avoid infinite loops).
3. **Unresolvable failures** — surface them as `<!-- TODO: review — <issue> -->` comments and note them in the summary.

## Confidence Threshold

| Confidence | When                                                                 | Action                                              |
| ---------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| **High**   | Clear correction, unambiguous language tag, obvious typo             | Proceed silently.                                   |
| **Medium** | Reasonable guess (tag inference, description wording, code language) | Proceed but add `<!-- TODO: review — <reason> -->`. |
| **Low**    | Genuinely unsure, meaning-altering change, ambiguous intent          | Stop and ask using `#tool:vscode_askQuestions`.     |
