import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface ArchivePageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

function slugToTitle(slug: string): string {
  const last = (slug || "").split("/").pop() || slug;
  const stripped = last.replace(/^\d+-/, "");
  return stripped
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ArchivePage({ onMeta }: ArchivePageProps) {
  const { "*": archivePath } = useParams();
  const [html, setHtml] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!archivePath) return;

    let cancelled = false;

    fetch(`/content/archive/${archivePath}.html`)
      .then((r) => {
        if (!r.ok) throw new Error(`Not found: ${r.status}`);
        return r.text();
      })
      .then((content) => {
        if (cancelled) return;
        setNotFound(false);
        setHtml(content);

        const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).length;
        const readingTime = Math.max(1, Math.round(wordCount / 200));

        // Try to extract the title from the first <h1> in the rendered HTML,
        // fall back to humanising the slug.
        const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = h1Match
          ? h1Match[1].replace(/<[^>]*>/g, "").trim()
          : slugToTitle(archivePath);

        onMeta({ title, path: `archive/${archivePath}`, readingTime });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [archivePath, onMeta]);

  if (notFound) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--vscode-tab-inactiveForeground)" }}
      >
        Archive entry not found.
      </div>
    );
  }

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

  // Strip leading <h1> — we let the post body render naturally (the archive
  // notice blockquote will be the first visible element after the heading).
  const processedHtml = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");

  const title = (() => {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return h1Match
      ? h1Match[1].replace(/<[^>]*>/g, "").trim()
      : slugToTitle(archivePath || "");
  })();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {title}
        </h1>
      </div>
      <MarkdownRenderer html={processedHtml} />
    </div>
  );
}
