import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { PostMeta } from "../types";

interface FileExplorerProps {
  currentPath: string;
}

function estimateReadingTime(description: string): number {
  // Rough estimate based on typical post length; will be refined when post is opened
  return description.length > 100 ? 4 : 2;
}

/** VS Code–style collapsible section header (like OUTLINE, TIMELINE, ISSUES). */
function SectionHeader({
  label,
  count,
  expanded,
  onToggle,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="w-full text-left flex items-center gap-1 cursor-pointer select-none"
      style={{
        height: 22,
        paddingLeft: 8,
        paddingRight: 8,
        background: "var(--vscode-sideBarSectionHeader-background)",
        color: "var(--vscode-sideBarSectionHeader-foreground)",
        borderTop: "1px solid var(--vscode-sideBarSectionHeader-border)",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          "var(--vscode-list-hoverBackground)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          "var(--vscode-sideBarSectionHeader-background)";
      }}
      onClick={onToggle}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="flex-shrink-0"
        style={{
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.1s ease",
        }}
      >
        <path d="M6 4l4 4-4 4z" />
      </svg>
      <span className="truncate">{label}</span>
      <span
        className="ml-auto text-xs px-1.5 rounded-full"
        style={{
          backgroundColor: "var(--vscode-badge-background)",
          color: "var(--vscode-badge-foreground)",
          fontSize: 10,
          lineHeight: "16px",
          minWidth: 18,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export function FileExplorer({ currentPath }: FileExplorerProps) {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [archiveEntries, setArchiveEntries] = useState<PostMeta[]>([]);
  const [postsExpanded, setPostsExpanded] = useState(true);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/posts-meta.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);

    fetch("/archive-meta.json")
      .then((r) => r.json())
      .then(setArchiveEntries)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── POSTS section: always flex-1, pushes archive to bottom ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 0",
          minHeight: 22,
          overflow: "hidden",
        }}
      >
        <SectionHeader
          label="Posts"
          count={posts.length}
          expanded={postsExpanded}
          onToggle={() => setPostsExpanded((v) => !v)}
        />

        {postsExpanded && (
          <div
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
            className="py-0.5"
          >
            {posts.map((post) => {
              const postPath = `posts/${post.slug}`;
              const isActive = currentPath === postPath;

              return (
                <button
                  key={post.slug}
                  className="w-full text-left cursor-pointer block"
                  style={{
                    paddingLeft: "20px",
                    paddingRight: "8px",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    backgroundColor: isActive
                      ? "var(--vscode-list-activeSelectionBackground)"
                      : undefined,
                    color: isActive
                      ? "var(--vscode-list-activeSelectionForeground)"
                      : "var(--vscode-editor-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor =
                        "var(--vscode-list-hoverBackground)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "";
                  }}
                  onClick={() => navigate(`/posts/${post.slug}`)}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="flex-shrink-0 text-xs">📄</span>
                    <span className="text-sm truncate font-medium">
                      {post.title}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs ml-5"
                    style={{
                      color: isActive
                        ? "var(--vscode-list-activeSelectionForeground)"
                        : "var(--vscode-tab-inactiveForeground)",
                      opacity: isActive ? 0.85 : 1,
                    }}
                  >
                    {post.date && (
                      <span>
                        {new Date(post.date + "T12:00:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    )}
                    <span>·</span>
                    <span>
                      {estimateReadingTime(post.description)} min read
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ARCHIVE section: fixed 22px when collapsed, flex-1 when expanded ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: archiveExpanded ? "1 1 0" : "0 0 22px",
          minHeight: 22,
          overflow: "hidden",
        }}
      >
        <SectionHeader
          label="Archive"
          count={archiveEntries.length}
          expanded={archiveExpanded}
          onToggle={() => setArchiveExpanded((v) => !v)}
        />

        {archiveExpanded && (
          <div
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
            className="py-0.5"
          >
            {archiveEntries.length === 0 ? (
              <div
                className="text-xs px-5 py-2"
                style={{ color: "var(--vscode-tab-inactiveForeground)" }}
              >
                No archived posts yet.
              </div>
            ) : (
              archiveEntries.map((entry) => {
                const archivePath = `archive/${entry.slug}`;
                const isActive = currentPath === archivePath;

                return (
                  <button
                    key={entry.slug}
                    className="w-full text-left cursor-pointer block"
                    style={{
                      paddingLeft: "20px",
                      paddingRight: "8px",
                      paddingTop: "6px",
                      paddingBottom: "6px",
                      backgroundColor: isActive
                        ? "var(--vscode-list-activeSelectionBackground)"
                        : undefined,
                      color: isActive
                        ? "var(--vscode-list-activeSelectionForeground)"
                        : "var(--vscode-editor-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor =
                          "var(--vscode-list-hoverBackground)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "";
                    }}
                    onClick={() => navigate(`/archive/${entry.slug}`)}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="flex-shrink-0 text-xs">📄</span>
                      <span className="text-sm truncate font-medium">
                        {entry.title}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs ml-5"
                      style={{
                        color: isActive
                          ? "var(--vscode-list-activeSelectionForeground)"
                          : "var(--vscode-tab-inactiveForeground)",
                        opacity: isActive ? 0.85 : 1,
                      }}
                    >
                      {entry.date && (
                        <span>
                          {new Date(
                            entry.date + "T12:00:00",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        {estimateReadingTime(entry.description)} min read
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
