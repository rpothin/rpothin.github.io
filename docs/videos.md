# Embedding YouTube videos in site content

This site **supports YouTube video embeds** in Markdown-based content (posts, `about.md`, `privacy.md`, etc.).

Because the Markdown renderer is configured with `html: true`, raw HTML blocks inside `.md` files are passed through as-is and rendered in the browser.

## How to embed a YouTube video

Use a `<div class="video-container">` wrapper around the standard YouTube `<iframe>` embed. The wrapper provides a responsive 16:9 aspect ratio so the video scales correctly on all screen sizes.

### Basic snippet

Replace `VIDEO_ID` with the 11-character YouTube video ID found after `v=` in the URL (e.g. `https://www.youtube.com/watch?v=VIDEO_ID`).

```html
<div class="video-container">
  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="Short description of the video"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>
```

### Real-world example

For the video at `https://www.youtube.com/watch?v=dQw4w9WgXcQ`:

```html
<div class="video-container">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    title="Rick Astley – Never Gonna Give You Up (Official Video)"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>
```

You can place this block anywhere in a Markdown file, either on its own or between regular paragraphs:

```md
Read the prerequisites above, then watch the full walkthrough:

<div class="video-container">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    title="Full walkthrough video"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>

Continue reading below for the step-by-step written guide.
```

## How it works

- The build script (`scripts/build-content.ts`) processes Markdown with `markdown-it` and `html: true`.
- Raw HTML blocks are preserved verbatim in the generated `.html` file under `public/content/`.
- At runtime, the `MarkdownRenderer` component injects the HTML into the DOM.
- The `.video-container` CSS class (defined in `src/index.css`) applies a 16:9 padding-bottom trick so the iframe fills its container responsively on any viewport.

## Privacy tip: use the privacy-enhanced embed domain

YouTube offers a privacy-enhanced mode that avoids setting tracking cookies unless the user plays the video. Swap the domain in `src`:

| Standard embed                           | Privacy-enhanced embed                            |
| ---------------------------------------- | ------------------------------------------------- |
| `https://www.youtube.com/embed/VIDEO_ID` | `https://www.youtube-nocookie.com/embed/VIDEO_ID` |

```html
<div class="video-container">
  <iframe
    src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
    title="Short description of the video"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>
```

## Accessibility: always provide a `title`

The `title` attribute on the `<iframe>` is used by screen readers to announce the embedded content. Keep it short and descriptive.

- ✅ `title="Demo: deploying a Power Platform solution with GitHub Actions"`
- ✅ `title="Quick overview of the GitHub Copilot chat interface"`
- ❌ `title="video"`
- ❌ `title="YouTube video player"` (generic, unhelpful)

## Start a video at a specific timestamp

Append `?start=SECONDS` to the embed URL:

```html
src="https://www.youtube-nocookie.com/embed/VIDEO_ID?start=90"
```

`start=90` skips to the 1:30 mark.

## Common gotchas

| Issue                             | Cause                                           | Fix                                                     |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Video does not display            | Missing `<div class="video-container">` wrapper | Add the wrapper as shown above                          |
| Black bars / wrong aspect ratio   | Using a fixed `height` on the iframe            | Remove `height`; let the CSS wrapper control it         |
| Video plays automatically on load | `autoplay=1` appended to the `src` URL          | Remove `autoplay=1`; never autoplay without user intent |
| Cookies set before user plays     | Using `www.youtube.com` embed domain            | Switch to `www.youtube-nocookie.com`                    |
