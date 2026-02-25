# Accessibility

This site is built with accessibility as a first-class concern. This document explains how accessibility is implemented across the codebase so you can maintain and extend it correctly.

## Table of contents

- [Document language and metadata](#document-language-and-metadata)
- [Skip link](#skip-link)
- [Focus management on navigation](#focus-management-on-navigation)
- [Focus-visible outlines](#focus-visible-outlines)
- [Landmark regions](#landmark-regions)
- [Activity bar](#activity-bar)
- [Tab bar](#tab-bar)
- [File explorer sidebar](#file-explorer-sidebar)
- [Search panel](#search-panel)
- [Markdown content](#markdown-content)
- [Screen-reader-only utility class](#screen-reader-only-utility-class)
- [Decorative elements](#decorative-elements)

---

## Document language and metadata

**File:** `index.html`

The root `<html>` element declares `lang="en"` so screen readers use the correct language profile. A `<meta name="description">` is provided for SEO and assistive technology context.

---

## Skip link

**File:** `index.html`

A visually hidden skip link is the very first element in `<body>`, before the React root. It is off-screen by default and becomes visible only when it receives keyboard focus:

```html
<a href="#main-content" ...>Skip to main content</a>
```

Inline `onfocus`/`onblur` handlers swap the element's `style.cssText` between its hidden state and a fully visible blue button (VS Code `#007acc` background). This avoids any dependency on CSS loading order.

The link targets `id="main-content"` on the `<main>` element rendered by React.

---

## Focus management on navigation

**File:** `src/App.tsx`

The site is a single-page application (SPA). Without intervention, client-side route changes do not move browser focus, which disorients keyboard and screen-reader users.

`App.tsx` solves this with a `ref` on `<main>` and a `useEffect` that focuses it on every route change:

```tsx
const mainRef = useRef<HTMLElement>(null);

useEffect(() => {
  mainRef.current?.focus();
}, [location.pathname]);

<main id="main-content" ref={mainRef} tabIndex={-1} style={{ outline: "none" }}>
```

- `tabIndex={-1}` makes `<main>` programmatically focusable without placing it in the natural tab order.
- `style={{ outline: "none" }}` is reinforced by `main:focus { outline: none }` in CSS (see below) — the focus ring is suppressed because the focus is invisible to mouse users and is purely for screen reader announcement.

---

## Focus-visible outlines

**File:** `src/index.css`

All interactive elements show a 2 px VS Code-blue focus ring when navigated to by keyboard, using the `:focus-visible` pseudo-class (which suppresses the ring for mouse clicks):

```css
:focus-visible {
  outline: 2px solid var(--vscode-statusBar-background); /* #007acc */
  outline-offset: 2px;
  border-radius: 2px;
}

main:focus {
  outline: none;
}
```

The `main:focus` override prevents a ring from appearing when `App.tsx` programmatically moves focus on route change.

---

## Landmark regions

**Files:** `index.html`, `src/App.tsx`, `src/components/StatusBar.tsx`

The page uses HTML5 landmark elements so screen reader users can jump between regions:

| Landmark                  | Element                                                           | Location                         |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------- |
| Skip target               | `<main id="main-content">`                                        | `src/App.tsx`                    |
| Footer / contentinfo      | `<footer role="contentinfo" aria-label="Status bar">`             | `src/components/StatusBar.tsx`   |
| Navigation (activity bar) | `<nav aria-label="Activity bar">`                                 | `src/components/ActivityBar.tsx` |
| Navigation (sidebar)      | `<nav aria-label="File explorer">` or `<nav aria-label="Search">` | `src/components/Sidebar.tsx`     |

The sidebar `<nav>` label switches dynamically (`"File explorer"` or `"Search"`) to reflect which panel is active.

---

## Activity bar

**File:** `src/components/ActivityBar.tsx`

The vertical icon bar on the far left uses a `<nav aria-label="Activity bar">` wrapper. Buttons are grouped into two `role="group"` sections with labels:

- `aria-label="Views"` — Explorer and Search toggles
- `aria-label="Settings"` — About, Privacy, Theme switcher

Toggle buttons (Explorer, Search) use `aria-pressed` to communicate their on/off state:

```tsx
<button aria-pressed={activeView === "explorer" && sidebarVisible}>
```

The theme button dynamically updates its label based on current theme:

```tsx
aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
```

All SVG icons use `aria-hidden="true"` — their containing buttons carry the accessible name.

---

## Tab bar

**File:** `src/components/TabBar.tsx`

The tab strip follows the ARIA tabs pattern:

```tsx
<div role="tablist" aria-label="Open tabs">
  <button
    role="tab"
    aria-selected={isActive}
    tabIndex={isActive ? 0 : -1}
    id={`tab-${tab.id}`}
  >
```

- Only the active tab is in the natural tab order (`tabIndex={0}`); all others are `tabIndex={-1}`.
- **Arrow key navigation:** `ArrowLeft` and `ArrowRight` move focus between tabs and activate the corresponding route. `Home` and `End` jump to the first and last tab.
- Close buttons inside tabs are `tabIndex={-1}` so they don't appear in the tab's own keyboard flow; they are reachable by mouse.

### Context menu

Right-clicking a tab opens a context menu built with proper ARIA:

```tsx
<div role="menu" aria-label="Tab options">
  <button role="menuitem">Close</button>
  <button role="menuitem">Close Others</button>
  <button role="menuitem">Close All</button>
</div>
```

Pressing `Escape` closes the menu and returns focus.

---

## File explorer sidebar

**File:** `src/components/FileExplorer.tsx`

Section headers (Posts, Archive) are toggle buttons with `aria-expanded` to announce whether that group is open or closed:

```tsx
<button aria-expanded={expanded}>Posts</button>
```

File lists use semantic `<ul role="list">/<li>` structure. Each post button marks the currently active page:

```tsx
<button aria-current={isActive ? "page" : undefined}>
```

Decorative emoji characters (folder icons, file icons) are wrapped in `<span aria-hidden="true">` so they are not read out by screen readers. Item counts use a dedicated `aria-label`:

```tsx
<span aria-label={`${count} items`}>{count}</span>
```

---

## Search panel

**File:** `src/components/SearchPanel.tsx`

The search input is labelled with `aria-label`:

```tsx
<input aria-label="Search posts" />
```

A visually hidden live region announces result counts to screen readers as the user types, without moving focus:

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {query
    ? results.length > 0
      ? `${results.length} results found`
      : "No results found"
    : ""}
</div>
```

The results list uses `role="list" aria-label="Search results"`.

---

## Markdown content

**File:** `src/components/MarkdownRenderer.tsx`, `scripts/build-content.ts`

Post and archive content is pre-rendered to static HTML at build time (`scripts/build-content.ts`). Two accessibility features are injected during this process and then enforced at runtime by `MarkdownRenderer.tsx`.

### Copy-code buttons

The build script injects copy buttons into every `<pre>` block with ARIA attributes in the HTML string itself:

```html
<button
  class="copy-button"
  aria-label="Copy code to clipboard"
  aria-live="polite"
>
  Copy
</button>
```

At runtime, `MarkdownRenderer.tsx` uses a `useLayoutEffect` to add click-handler logic. It also re-applies `aria-label` and `aria-live` unconditionally (outside the "create button" branch) to ensure correctness regardless of whether the button came from the build script or was created dynamically:

```ts
button.setAttribute("aria-label", "Copy code to clipboard");
button.setAttribute("aria-live", "polite");
```

When the user copies, the label changes to `"Code copied to clipboard"` and reverts after 2 seconds, providing a screen-reader-audible confirmation without a visual-only toast.

### External links

The `openExternalLinksInNewTab()` function post-processes the pre-built HTML before it is injected via `dangerouslySetInnerHTML`. It adds `target="_blank" rel="noopener noreferrer"` to all external links and appends a screen-reader-only span:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Link text<span class="sr-only"> (opens in new tab)</span>
</a>
```

The function guards against double-injection: if the link already contains the text "opens in new tab" it is left untouched.

> **Note:** The build script also adds `target="_blank"` to some links. `openExternalLinksInNewTab()` intentionally skips adding a duplicate `target` attribute if one already exists, but it still injects the `.sr-only` span.

---

## Screen-reader-only utility class

**File:** `src/index.css`

The `.sr-only` class hides content visually while keeping it available to assistive technologies:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

It is used in:

- The search panel live region
- External link annotations (`" (opens in new tab)"`)

---

## Decorative elements

Throughout the UI, purely decorative characters (emoji used as icons, separator bars, coffee cup) are hidden from assistive technologies with `aria-hidden="true"`:

| Location           | Element                    | Reason                                |
| ------------------ | -------------------------- | ------------------------------------- |
| `ActivityBar.tsx`  | SVG icons                  | Named by parent button's `aria-label` |
| `FileExplorer.tsx` | 📄 📂 emoji, `·` separator | Decorative; file name is the label    |
| `HomePage.tsx`     | All emoji spans            | Decorative visual accents             |
| `StatusBar.tsx`    | `\|` separator, ☕ emoji   | Decorative                            |
| `TabBar.tsx`       | ✕ close icon span          | Close button has its own `aria-label` |
