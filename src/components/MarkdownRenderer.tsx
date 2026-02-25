import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface MarkdownRendererProps {
  html: string;
}

/**
 * Processes an HTML string so that every external link (http/https pointing to
 * a different origin) gets `target="_blank" rel="noopener noreferrer"`.
 *
 * This runs *before* React sets innerHTML, so the links are correct from the
 * first paint — no layout-effect DOM patching required.
 */
function openExternalLinksInNewTab(raw: string): string {
  // Match opening <a …> tags that contain an href starting with http(s).
  return raw.replace(
    /<a\s([^>]*href\s*=\s*"https?:\/\/[^"]*"[^>]*)>/gi,
    (fullMatch, attrs: string) => {
      // Don't touch links that already declare a target.
      if (/\btarget\s*=/i.test(attrs)) return fullMatch;

      return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
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

      if (button.dataset.copyBound === "true") return;
      button.dataset.copyBound = "true";

      button.addEventListener("click", () => {
        const text = code.textContent || "";
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            button!.textContent = "Copied!";
            setTimeout(() => {
              button!.textContent = "Copy";
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
        setTimeout(() => {
          button!.textContent = "Copy";
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
