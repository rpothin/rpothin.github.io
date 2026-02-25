import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface MarkdownRendererProps {
  html: string;
}

/**
 * Processes an HTML string so that every external link (http/https pointing to
 * a different origin) gets `target="_blank" rel="noopener noreferrer"` plus a
 * visually-hidden indicator that it opens in a new tab.
 *
 * This runs *before* React sets innerHTML, so the links are correct from the
 * first paint — no layout-effect DOM patching required.
 */
function openExternalLinksInNewTab(raw: string): string {
  // Match opening <a …> tags that contain an href starting with http(s).
  return raw.replace(
    /<a\s([^>]*href\s*=\s*"https?:\/\/[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi,
    (fullMatch, attrs: string, content: string) => {
      // If the link already has a sr-only "opens in new tab" annotation, leave it alone.
      if (/opens in new tab/i.test(content)) return fullMatch;

      // Ensure target and rel are set (may already be injected by the build script).
      let newAttrs = attrs;
      if (!/\btarget\s*=/i.test(attrs)) {
        newAttrs += ' target="_blank" rel="noopener noreferrer"';
      }

      return `<a ${newAttrs}>${content}<span class="sr-only"> (opens in new tab)</span></a>`;
    },
  );
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Process HTML string before rendering — adds target/rel to external links.
  const processedHtml = useMemo(() => openExternalLinksInNewTab(html), [html]);

  // Intercept clicks on internal links so they go through React Router (and
  // open as tabs) instead of triggering a full page load.
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Only intercept same-origin relative paths (e.g. /archive/..., /posts/...)
      if (href.startsWith("/")) {
        e.preventDefault();
        navigate(href);
      }
    },
    [navigate],
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const pres = containerRef.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      pre.style.position = "relative";
      const code = pre.querySelector("code");
      if (!code) return;

      let button = pre.querySelector(
        ".copy-button",
      ) as HTMLButtonElement | null;
      if (!button) {
        button = document.createElement("button");
        button.className = "copy-button";
        button.type = "button";
        button.title = "Copy code";
        button.textContent = "Copy";
        pre.insertBefore(button, pre.firstChild);
      }
      // Always ensure ARIA attributes are present (button may have been
      // injected by the build script without them).
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.setAttribute("aria-live", "polite");

      if (button.dataset.copyBound === "true") return;
      button.dataset.copyBound = "true";

      button.addEventListener("click", () => {
        const text = code.textContent || "";
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            button!.textContent = "Copied!";
            button!.setAttribute("aria-label", "Code copied to clipboard");
            setTimeout(() => {
              button!.textContent = "Copy";
              button!.setAttribute("aria-label", "Copy code to clipboard");
            }, 2000);
          });
          return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        pre.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        pre.removeChild(textarea);
        button!.textContent = "Copied!";
        button!.setAttribute("aria-label", "Code copied to clipboard");
        setTimeout(() => {
          button!.textContent = "Copy";
          button!.setAttribute("aria-label", "Copy code to clipboard");
        }, 2000);
      });
    });
  }, [processedHtml]);

  return (
    <>
      <div
        ref={containerRef}
        className="markdown-body"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  );
}
