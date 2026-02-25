import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import type { PostMeta } from "../types";

interface PostPageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function PostPage({ onMeta }: PostPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState("");
  const [meta, setMeta] = useState<PostMeta | null>(null);
  const [readingTime, setReadingTime] = useState<number | null>(null);

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

  useEffect(() => {
    if (!slug) return;

    fetch(`/content/posts/${slug}.html`)
      .then((r) => r.text())
      .then((content) => {
        setHtml(content);
        const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).length;
        const readingTime = Math.max(1, Math.round(wordCount / 200));
        setReadingTime(readingTime);

        fetch("/posts-meta.json")
          .then((r) => r.json())
          .then((posts: PostMeta[]) => {
            const post = posts.find((p) => p.slug === slug);
            setMeta(post || null);
            onMeta({
              title: post?.title || slug,
              path: `posts/${slug}`,
              readingTime,
            });
          });
      })
      .catch(console.error);
  }, [slug, onMeta]);

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
  const processedHtml = html.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/i, "");

  return (
    <div className="max-w-4xl mx-auto p-8">
      {meta && (
        <div className="mb-8">
          <h1
            className="text-3xl font-semibold mb-4"
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            {meta.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {meta.date && (
              <img
                src={buildBadgeUrl(
                  "Published",
                  new Date(meta.date + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  ),
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
            {meta.tags.length > 0 && (
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
      )}
      <MarkdownRenderer html={processedHtml} />
    </div>
  );
}
