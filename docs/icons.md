# Updating the site icons (GitHub avatar)

This site uses your GitHub avatar as the browser/tab icon (favicon) and as the Apple touch icon.

## Where the icon files live

Generated icon assets live in `public/`:

- `public/github-avatar.png` (used as a PNG favicon)
- `public/favicon.ico` (classic multi-size favicon fallback)
- `public/apple-touch-icon.png` (iOS home screen icon)
- `public/github-avatar.jpg` (source image used to generate the assets)

The HTML references are in `index.html`:

- `/favicon.ico`
- `/github-avatar.png`
- `/apple-touch-icon.png`

## Quick refresh (recommended)

When you change your GitHub profile picture, refresh the local icon assets by re-downloading the avatar and regenerating the files.

### Prerequisites

- `curl`
- ImageMagick (`magick`)

In the dev container used for this repo, both are available.

### Steps

1. Download the latest avatar (adjust the size if you want a larger source):

   curl -L -o public/github-avatar.jpg "https://github.com/rpothin.png?size=512"

2. Regenerate the PNG favicon, ICO, and Apple touch icon:

   magick public/github-avatar.jpg -resize 128x128 public/github-avatar.png
   magick public/github-avatar.jpg -define icon:auto-resize=16,32,48 public/favicon.ico
   magick public/github-avatar.jpg -resize 180x180 public/apple-touch-icon.png

3. Build and verify:

   npm run build

### Notes

- Browsers can cache favicons aggressively. If you don’t see the new icon immediately:
  - Hard refresh
  - Try an incognito/private window
  - Bump the favicon URL with a query string (e.g. `/github-avatar.png?v=2`) if needed.

## Alternative: manual update

If you don’t want to use ImageMagick:

1. Download your avatar image from GitHub.
2. Use a favicon generator (online or local) to produce:
   - `favicon.ico`
   - a ~128×128 PNG
   - a 180×180 Apple touch icon
3. Replace the files in `public/` with the same names:
   - `public/favicon.ico`
   - `public/github-avatar.png`
   - `public/apple-touch-icon.png`

## Optional cleanup

If you no longer need the original Vite icon, you can delete `public/vite.svg`.

(Keeping it is harmless; it’s just unused now.)
