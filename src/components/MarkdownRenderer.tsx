import { useEffect, useRef } from 'react';

interface MarkdownRendererProps {
  html: string;
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const codeBlocks = containerRef.current.querySelectorAll('pre');
    codeBlocks.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.style.cssText =
        'position:absolute;top:8px;right:8px;padding:2px 8px;font-size:12px;cursor:pointer;border:1px solid var(--vscode-tab-inactiveForeground);border-radius:3px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);opacity:0;transition:opacity 0.2s;';

      pre.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
      pre.addEventListener('mouseleave', () => (btn.style.opacity = '0'));

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent || '');
          btn.textContent = 'Copied!';
          setTimeout(() => (btn.textContent = 'Copy'), 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
