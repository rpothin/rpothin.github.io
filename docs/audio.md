# Embedding audio deep dives in blog posts

This site supports **discrete audio players** embedded above a post's body. The player is powered by the `AudioPlayer` React component and is rendered automatically when the `audioUrl` frontmatter field is set.

Audio files are stored in the `content/` directory (tracked by git) and copied to `public/content/` by the build script at build time, so no external hosting service is required.

## How it works

1. You add an `audioUrl` field to a post's frontmatter pointing to an audio file under `public/content/` (its build-time output path).
2. The build script (`scripts/build-content.ts`) reads the field and includes it in `public/posts-meta.json`.
3. The build script also copies all non-Markdown files from `content/` to `public/content/`, so the audio file is available at the referenced URL.
4. When the post is opened, `PostPage.tsx` reads `audioUrl` from metadata and renders an `<AudioPlayer>` component above the Markdown content.

The player is intentionally compact: a play/pause button, a labelled seek bar, and a current/total time display — all styled with VS Code theme variables so it blends with the rest of the site.

## Storing audio files

Put audio files alongside other per-post static assets under `content/posts/<slug>/`:

> [!IMPORTANT]
> Store files under `content/`, **not** `public/content/`. The `public/content/` directory is generated at build time and is listed in `.gitignore` — files placed there directly will not be committed to the repository.

```
content/
  posts/
    getting-started-with-github-actions/
      audio-deep-dive.mp3
    getting-started-with-github-actions.md
```

The build script copies all non-Markdown files from `content/` to `public/content/` recursively, so the file will be accessible at `/content/posts/getting-started-with-github-actions/audio-deep-dive.mp3` in the browser.

## Supported formats

Use **MP3** (`.mp3`) as the primary format — it has near-universal browser support. Alternatives:

| Format      | Extension | Notes                                     |
| ----------- | --------- | ----------------------------------------- |
| MP3         | `.mp3`    | Best compatibility across all browsers    |
| AAC         | `.m4a`    | Good quality, supported everywhere modern |
| Opus (WebM) | `.webm`   | Best compression, limited Safari support  |
| OGG Vorbis  | `.ogg`    | Open format, not supported in Safari      |

## Setting the frontmatter field

Add `audioUrl` with an **absolute path** (starting with `/`) to the post's frontmatter:

```yaml
---
title: Getting started with GitHub Actions
date: 2026-03-04
tags: [github, ci-cd, devops]
description: A practical introduction to GitHub Actions workflows.
audioUrl: /content/posts/getting-started-with-github-actions/audio-deep-dive.mp3
---
```

> [!NOTE]
> Because `audioUrl` is optional, posts without the field are completely unaffected — they render exactly as before.

## Why use an absolute path

Post routes look like `/posts/<slug>`. A relative path such as `audio-deep-dive.mp3` would resolve to `/posts/audio-deep-dive.mp3`, which is incorrect. Use the full path from the site root:

```
/content/posts/<slug>/<filename>.mp3
```

## Full example

**File layout:**

```
content/posts/my-deep-dive/deep-dive.mp3
content/posts/my-deep-dive.md
```

**Frontmatter in `content/posts/my-deep-dive.md`:**

```yaml
---
title: My deep dive
date: 2026-03-04
tags: [example]
description: A post with an accompanying audio deep dive.
audioUrl: /content/posts/my-deep-dive/deep-dive.mp3
---
```

The player will appear above the post body with the title used as its accessible label.

## Accessibility considerations

- The player is wrapped in a labelled `role="region"` landmark (`Audio deep dive: <title>`).
- The play/pause button has an `aria-label` that updates to reflect the current state.
- The seek range input has an `aria-label` of `"Seek"`.
- The time display is excluded from live announcements (`aria-live="off"`) to avoid constant screen-reader interruptions.

Make sure the audio file itself is accessible where relevant (e.g. provide a transcript for content-heavy narration).

## Troubleshooting

| Symptom                                | Likely cause                                                          | Fix                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Player does not appear                 | `audioUrl` not in frontmatter, or build not re-run                    | Add/correct the field and run `npm run build`                                                                           |
| Player appears but audio does not load | Wrong path in `audioUrl`                                              | Verify the file exists under `content/` at the corresponding path                                                       |
| 404 when clicking play                 | File not committed / not in `content/`                                | Ensure the audio file is committed and lives under `content/posts/<slug>/`, not `public/content/` (which is gitignored) |
| Audio plays but seek bar is stuck at 0 | Browser cannot determine duration (streaming URL, unsupported format) | Use a locally served MP3 with a proper `Content-Length` header                                                          |
