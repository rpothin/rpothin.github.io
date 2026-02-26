import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { PostMeta } from "../types";

interface ArchiveMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

interface SeriesInfo {
  folder: string;
  label: string;
  count: number;
  latestDate: string;
  firstSlug: string;
}

/** Unified entry for the content list */
interface ContentEntry {
  slug: string;
  title: string;
  date: string;
  archived: boolean;
  route: string;
}

interface HomePageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
  onSearchTopic?: (tag: string) => void;
}

const CONTENT_LIST_LIMIT = 10;

export function HomePage({ onMeta, onSearchTopic }: HomePageProps) {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [archive, setArchive] = useState<ArchiveMeta[]>([]);

  useEffect(() => {
    onMeta({ title: "Welcome", path: "", readingTime: 0 });
    fetch("/posts-meta.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
    fetch("/archive-meta.json")
      .then((r) => r.json())
      .then(setArchive)
      .catch(console.error);
  }, [onMeta]);

  // Build unified content list (posts + archive), sorted newest-first
  const allContent: ContentEntry[] = [
    ...posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      archived: false,
      route: `/posts/${p.slug}`,
    })),
    ...archive.map((a) => ({
      slug: a.slug,
      title: a.title,
      date: a.date,
      archived: true,
      route: `/archive/${a.slug}`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, CONTENT_LIST_LIMIT);

  // Derive series info from archive
  const seriesMap = new Map<string, SeriesInfo>();
  for (const item of archive) {
    const slashIdx = item.slug.indexOf("/");
    if (slashIdx > 0) {
      const folder = item.slug.slice(0, slashIdx);
      const existing = seriesMap.get(folder);
      if (existing) {
        existing.count++;
        if (item.date > existing.latestDate) existing.latestDate = item.date;
        // Track earliest slug for linking to first post
        if (item.slug < existing.firstSlug) existing.firstSlug = item.slug;
      } else {
        const label = folder
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        seriesMap.set(folder, {
          folder,
          label,
          count: 1,
          latestDate: item.date,
          firstSlug: item.slug,
        });
      }
    }
  }
  const series = Array.from(seriesMap.values()).sort((a, b) =>
    b.latestDate.localeCompare(a.latestDate),
  );

  // Collect all tags across posts and archive for topic display
  const tagCounts = new Map<string, number>();
  for (const item of [...posts, ...archive]) {
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div className="flex justify-center min-h-full py-8 px-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <section aria-labelledby="welcome-heading" className="mb-8">
          <h1
            id="welcome-heading"
            className="text-3xl font-light mb-1"
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            Raphael Pothin
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--vscode-tab-inactiveForeground)" }}
          >
            Software engineer writing about AI-native engineering, platform
            engineering, operational excellence, and Power Platform — in a VS
            Code-themed experience.
          </p>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* ─── Left column ─── */}
          <div className="space-y-8">
            {/* Start */}
            <section aria-labelledby="start-heading">
              <h2
                id="start-heading"
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--vscode-tab-inactiveForeground)" }}
              >
                Start
              </h2>
              <ul className="space-y-1.5 list-none p-0 m-0">
                <li>
                  <Link
                    to="/posts/welcome"
                    className="inline-flex items-center gap-2 text-sm no-underline hover:underline"
                    style={{
                      color: "var(--vscode-textLink-foreground, #3794ff)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M13.5 2H2.5C1.67 2 1 2.67 1 3.5v9C1 13.33 1.67 14 2.5 14h11c.83 0 1.5-.67 1.5-1.5v-9C15 2.67 14.33 2 13.5 2zM4 4h8v1H4V4zm8 3H4V6h8v1zm-2 2H4V8h6v1z" />
                    </svg>
                    Read the Welcome Post
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-sm no-underline hover:underline"
                    style={{
                      color: "var(--vscode-textLink-foreground, #3794ff)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM2 13c0-2.67 5.33-4 6-4s6 1.33 6 4v1H2v-1z" />
                    </svg>
                    About Me
                  </Link>
                </li>
                <li>
                  <a
                    href="/rss.xml"
                    className="inline-flex items-center gap-2 text-sm no-underline hover:underline"
                    style={{
                      color: "var(--vscode-textLink-foreground, #3794ff)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M2 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM2 7a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V7zm0-4a11 11 0 0 1 11 11h-2A9 9 0 0 0 2 5V3z" />
                    </svg>
                    Subscribe via RSS
                  </a>
                </li>
                <li>
                  <Link
                    to="/tips"
                    className="inline-flex items-center gap-2 text-sm no-underline hover:underline"
                    style={{
                      color: "var(--vscode-textLink-foreground, #3794ff)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6.5 12h3v1h-3v-1zm1-10a5 5 0 0 1 3 9.04V13h-5v-1.96A5 5 0 0 1 7.5 2zM6 12V10.7a4 4 0 1 1 4 0V12H6z" />
                    </svg>
                    Navigation Tips
                  </Link>
                </li>
              </ul>
            </section>

            {/* Recent content — unified posts + archive list */}
            <section aria-labelledby="recent-heading">
              <h2
                id="recent-heading"
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--vscode-tab-inactiveForeground)" }}
              >
                Recent
              </h2>
              {allContent.length > 0 ? (
                <ul className="space-y-1 list-none p-0 m-0">
                  {allContent.map((entry) => (
                    <li key={entry.route} className="flex items-center gap-2">
                      <Link
                        to={entry.route}
                        className="group flex items-baseline gap-3 py-1 text-sm no-underline hover:underline min-w-0 flex-1"
                        style={{
                          color: "var(--vscode-textLink-foreground, #3794ff)",
                        }}
                        aria-label={`${entry.title}${entry.archived ? " (archived)" : ""}${entry.date ? `, ${new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`}
                      >
                        <span className="truncate">{entry.title}</span>
                        {entry.date && (
                          <time
                            dateTime={entry.date}
                            className="shrink-0 text-xs whitespace-nowrap"
                            style={{
                              color: "var(--vscode-tab-inactiveForeground)",
                            }}
                          >
                            {new Date(
                              entry.date + "T12:00:00",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        )}
                      </Link>
                      {entry.archived && (
                        <span
                          className="shrink-0 text-xs px-1.5 py-0 rounded"
                          style={{
                            backgroundColor: "var(--vscode-badge-background)",
                            color: "var(--vscode-badge-foreground)",
                            fontSize: "10px",
                          }}
                          aria-label="Archived post"
                        >
                          archived
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="text-sm italic"
                  style={{ color: "var(--vscode-tab-inactiveForeground)" }}
                >
                  Loading…
                </p>
              )}
            </section>
          </div>

          {/* ─── Right column ─── */}
          <div className="space-y-8">
            {/* Series */}
            {series.length > 0 && (
              <section aria-labelledby="series-heading">
                <h2
                  id="series-heading"
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--vscode-tab-inactiveForeground)" }}
                >
                  Series
                </h2>
                <div className="space-y-3">
                  {series.map((s) => (
                    <Link
                      key={s.folder}
                      to={`/archive/${s.firstSlug}`}
                      className="welcome-card block p-4 rounded no-underline border"
                      style={{
                        backgroundColor: "var(--vscode-sideBar-background)",
                        borderColor:
                          "var(--vscode-widget-border, var(--vscode-badge-background))",
                      }}
                      aria-label={`${s.label} series, ${s.count} parts — start reading`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className="text-sm font-medium"
                          style={{
                            color: "var(--vscode-editor-foreground)",
                          }}
                        >
                          {s.label}
                        </h3>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--vscode-badge-background)",
                            color: "var(--vscode-badge-foreground)",
                          }}
                        >
                          {s.count} parts
                        </span>
                      </div>
                      {/* Progress bar visual */}
                      <div
                        className="w-full h-1 rounded-full mt-2"
                        style={{
                          backgroundColor:
                            "var(--vscode-progressBar-background, var(--vscode-badge-background))",
                          opacity: 0.3,
                        }}
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "100%",
                            backgroundColor:
                              "var(--vscode-progressBar-background, var(--vscode-statusBar-background))",
                            opacity: 1,
                          }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Topics */}
            {topTags.length > 0 && (
              <section aria-labelledby="topics-heading">
                <h2
                  id="topics-heading"
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--vscode-tab-inactiveForeground)" }}
                >
                  Topics
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map(([tag, count]) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSearchTopic?.(tag)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border-none cursor-pointer"
                      style={{
                        backgroundColor: "var(--vscode-badge-background)",
                        color: "var(--vscode-badge-foreground)",
                      }}
                      aria-label={`Search for ${tag} (${count} post${count > 1 ? "s" : ""})`}
                    >
                      {tag}
                      <span className="opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
