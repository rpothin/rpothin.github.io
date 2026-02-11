# Using images in site content

This site **supports images** in Markdown-based content (posts, `about.md`, `privacy.md`, etc.).

The important part is **where the image files live** and **how you reference them** so they work from any route.

## How images work here

- Markdown is rendered to HTML at build time by `scripts/build-content.ts` (via `markdown-it`).
- The generated HTML is saved under `public/content/**/*.html`.
- Your pages (e.g. `src/pages/PostPage.tsx`) fetch those HTML files and render them in the browser.

So when you write an image in Markdown, it becomes:

- Markdown: `![Alt text](/path/to/image.png)`
- HTML: `<img src="/path/to/image.png" alt="Alt text">`

## Recommended organization (Option B): per-post image folders

For a post with slug `<slug>` (the filename under `content/posts/`, without `.md`), put images here:

- `public/content/posts/<slug>/...`

Example:

```
content/posts/getting-started-with-github-actions.md
public/content/posts/getting-started-with-github-actions/workflow.png
public/content/posts/getting-started-with-github-actions/runner-logs.png
```

### Referencing the images from Markdown

You **do not need HTML**. The normal Markdown image syntax is perfect:

```md
![Workflow overview](/content/posts/getting-started-with-github-actions/workflow.png)
```

### Why the leading `/` matters

Use an **absolute path** (starts with `/`).

Because routes look like `/posts/<slug>`, a relative URL like:

```md
![Bad example](workflow.png)
```

…would be interpreted by the browser as:

- `/posts/workflow.png` (wrong location)

Using:

- `/content/posts/<slug>/workflow.png`

…works everywhere.

## Images for non-post pages (About, Privacy, etc.)

Those pages also render HTML from `public/content/*.html`.

A simple convention that matches the URL space is:

- `public/content/about/<files>` → reference as `/content/about/<files>`
- `public/content/privacy/<files>` → reference as `/content/privacy/<files>`

Example:

```
content/about.md
public/content/about/headshot.jpg
```

Markdown:

```md
![Portrait photo of Raphael](/content/about/headshot.jpg)
```

## Accessibility: writing good alt text

Alt text is required for accessibility and helps with SEO and broken-image fallbacks.

Good alt text:

- Describes the **meaning** of the image in context.
- Is concise (often 5–20 words).
- Avoids repeating surrounding text.

Examples:

- ✅ `![Screenshot of the GitHub Actions workflow summary page](/content/posts/my-post/workflow.png)`
- ✅ `![Architecture diagram: browser → GitHub Pages → analytics](/content/posts/my-post/architecture.png)`
- ❌ `![image](/content/posts/my-post/architecture.png)`
- ❌ `![screenshot](/content/posts/my-post/workflow.png)`

### Decorative images

If an image is purely decorative (adds no information), best practice is an empty alt.

Markdown doesn’t have a perfect “decorative image” shorthand, but you can do:

```md
![](/content/posts/my-post/divider.png)
```

Use this sparingly—most images in posts should have real alt text.

## Optional: captions and sizing (HTML is optional)

Markdown alone is enough for most cases.

If you want a caption, a common Markdown pattern is:

```md
![Workflow overview](/content/posts/my-post/workflow.png)

_Figure: The workflow that builds and deploys the site._
```

If you want more control (width/height, figure/caption), HTML is allowed because Markdown rendering is configured with `html: true`:

```html
<figure>
  <img
    src="/content/posts/my-post/workflow.png"
    alt="Workflow overview: build → test → deploy"
    width="900"
  />
  <figcaption>
    Figure: The workflow that builds and deploys the site.
  </figcaption>
</figure>
```

Notes:

- Adding `width`/`height` can reduce layout shift.
- Keep alt text meaningful even when using HTML.

## File naming and formats

- Prefer `kebab-case` filenames: `runner-logs.png`.
- Avoid spaces; avoid very long names.
- Use:
  - `.png` for screenshots/diagrams with text
  - `.jpg` for photos
  - `.svg` for icons/line art (when appropriate)

## Common gotcha: putting images under `content/`

Right now, `scripts/build-content.ts` only processes `.md` files and writes `.html` output.

It **does not copy** images from `content/` to `public/`.

So this will _not_ work unless you also place the image under `public/`:

```
content/posts/my-post.md
content/posts/my-post/workflow.png   ❌ not deployed
```

If you want a “content folder with colocated assets” workflow (images next to the Markdown), we can enhance the build script to copy those assets into `public/content/...` automatically.

## Quick checklist

- [ ] Put images under `public/content/posts/<slug>/...` (Option B)
- [ ] Reference them with an absolute path: `/content/posts/<slug>/<file>`
- [ ] Always add meaningful alt text
- [ ] Use HTML only when you need captions/sizing/layout
