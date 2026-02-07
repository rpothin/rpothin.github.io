import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface MarkdownRendererProps {
  html: string;
}

function CopyButton({ codeEl }: { codeEl: HTMLElement }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeEl.textContent || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeEl]);

  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        padding: "3px 10px",
        fontSize: 12,
        cursor: "pointer",
        border: "1px solid var(--vscode-tab-inactiveForeground)",
        borderRadius: 4,
        background: "var(--vscode-input-background)",
        color: "var(--vscode-input-foreground)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Copy code"
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [codeBlocks, setCodeBlocks] = useState<
    { el: HTMLElement; key: string }[]
  >([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const pres = containerRef.current.querySelectorAll("pre");
    const blocks: { el: HTMLElement; key: string }[] = [];

    pres.forEach((pre, i) => {
      pre.style.position = "relative";
      const code = pre.querySelector("code");
      if (code) {
        // Create a mount point for the React copy button
        let mountPoint = pre.querySelector(".copy-mount") as HTMLElement | null;
        if (!mountPoint) {
          mountPoint = document.createElement("div");
          mountPoint.className = "copy-mount";
          mountPoint.style.cssText =
            "position:absolute;top:0;right:0;z-index:10;";
          pre.appendChild(mountPoint);
        }
        blocks.push({ el: code, key: `code-${i}` });
      }
    });

    setCodeBlocks(blocks);
  }, [html]);

  return (
    <>
      <div
        ref={containerRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Render copy buttons using portals */}
      {codeBlocks.map(({ el, key }) => {
        const pre = el.closest("pre");
        const mountPoint = pre?.querySelector(".copy-mount");
        if (!mountPoint) return null;
        return createPortal(<CopyButton key={key} codeEl={el} />, mountPoint);
      })}
    </>
  );
}
