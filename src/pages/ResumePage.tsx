import { useState, useEffect, useCallback } from "react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface ResumePageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function ResumePage({ onMeta }: ResumePageProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/content/resume.html")
      .then((r) => r.text())
      .then((content) => {
        setHtml(content);
        const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).length;
        onMeta({
          title: "My Resume",
          path: "resume",
          readingTime: Math.max(1, Math.round(wordCount / 200)),
        });
      })
      .catch(console.error);
  }, [onMeta]);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  if (!html) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--vscode-tab-inactiveForeground)" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded cursor-pointer"
          style={{
            backgroundColor: "var(--vscode-statusBar-background)",
            color: "var(--vscode-statusBar-foreground)",
            border: "none",
          }}
          title="Export resume as PDF"
          aria-label="Export resume as PDF using browser print dialog"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4 1h8a1 1 0 0 1 1 1v3H3V2a1 1 0 0 1 1-1zM2 6h12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm3 5v3h6v-3H5zm6-3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
          Export as PDF
        </button>
      </div>
      <MarkdownRenderer html={html} />
    </div>
  );
}
