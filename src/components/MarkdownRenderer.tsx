import { useLayoutEffect, useRef } from "react";

interface MarkdownRendererProps {
  html: string;
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const pres = containerRef.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      pre.style.position = "relative";
      const code = pre.querySelector("code");
      if (!code) return;

      let button = pre.querySelector(".copy-button") as HTMLButtonElement | null;
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
  }, [html]);

  return (
    <>
      <div
        ref={containerRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
