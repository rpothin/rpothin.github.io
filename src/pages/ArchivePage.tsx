import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import type { PostMeta } from "../types";

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

const buildBadgeUrl = (
  label: string,
  message: string,
  color: string,
  logo?: string,
) => {
  const params = new URLSearchParams({
    label,
    message,
    color,
    style: "flat-square",
  });
  if (logo) {
    params.set("logo", logo);
    params.set("logoColor", "white");
  }
  return `https://img.shields.io/static/v1?${params.toString()}`;
};

export function ArchivePage({ onMeta }: ArchivePageProps) {
  const { "*": archivePath } = useParams();
  const [html, setHtml] = useState("");
  const [meta, setMeta] = useState<PostMeta | null>(null);
  const [readingTime, setReadingTime] = useState<number | null>(null);
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
        const rt = Math.max(1, Math.round(wordCount / 200));
        setReadingTime(rt);

        fetch("/archive-meta.json")
          .then((r) => r.json())
          .then((entries: PostMeta[]) => {
            if (cancelled) return;
            const entry = entries.find((e) => e.slug === archivePath);
            setMeta(entry || null);
            const title = entry?.title || slugToTitle(archivePath);
            onMeta({ title, path: `archive/${archivePath}`, readingTime: rt });
          });
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

  // Remove the first h1 from rendered HTML since we display the title ourselves
  const processedHtml = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");

  const title =
    meta?.title ||
    (() => {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      return h1Match
        ? h1Match[1].replace(/<[^>]*>/g, "").trim()
        : slugToTitle(archivePath || "");
    })();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-4"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {meta?.date && (
            <img
              src={buildBadgeUrl(
                "Published",
                new Date(meta.date + "T12:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                "007acc",
                "calendar",
              )}
              alt={`Published ${meta.date}`}
              className="h-5"
            />
          )}
          {readingTime && (
            <img
              src={buildBadgeUrl(
                "Reading",
                `${readingTime} min`,
                "2ecc71",
                "clock",
              )}
              alt={`${readingTime} min read`}
              className="h-5"
            />
          )}
          {meta?.tags && meta.tags.length > 0 && (
            <img
              src={buildBadgeUrl(
                "Tags",
                meta.tags.join(" • "),
                "8e44ad",
                "tag",
              )}
              alt={`Tags: ${meta.tags.join(" • ")}`}
              className="h-5"
            />
          )}
        </div>
      </div>
      <MarkdownRenderer html={processedHtml} />
    </div>
  );
}
