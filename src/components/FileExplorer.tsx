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
      aria-expanded={expanded}
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
        aria-hidden="true"
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
        aria-label={`${count} items`}
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
  const [postsExpanded, setPostsExpanded] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/posts-meta.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── POSTS section ── */}
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
          <ul
            role="list"
            style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
            className="py-0.5"
          >
            {posts.map((post) => {
              const postPath = `posts/${post.slug}`;
              const isActive = currentPath === postPath;

              return (
                <li key={post.slug}>
                  <button
                    className="w-full text-left cursor-pointer block"
                    aria-current={isActive ? "page" : undefined}
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
                      <span
                        className="flex-shrink-0 text-xs"
                        aria-hidden="true"
                      >
                        📄
                      </span>
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
                      <span aria-hidden="true">·</span>
                      <span>
                        {estimateReadingTime(post.description)} min read
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
