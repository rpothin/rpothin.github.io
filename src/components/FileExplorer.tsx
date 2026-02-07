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

export function FileExplorer({ currentPath }: FileExplorerProps) {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/posts-meta.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
  }, []);

  return (
    <div className="py-1">
      {/* Posts folder header */}
      <button
        className="w-full text-left flex items-center gap-1 py-0.5 pr-2 text-sm cursor-pointer"
        style={{
          paddingLeft: "8px",
          color: "var(--vscode-editor-foreground)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--vscode-list-hoverBackground)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "";
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex-shrink-0 w-4 text-center text-xs">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="flex-shrink-0">{expanded ? "📂" : "📁"}</span>
        <span className="truncate font-medium">posts</span>
        <span
          className="ml-auto text-xs px-1.5 rounded-full"
          style={{
            backgroundColor: "var(--vscode-badge-background)",
            color: "var(--vscode-badge-foreground)",
          }}
        >
          {posts.length}
        </span>
      </button>

      {/* Post entries */}
      {expanded &&
        posts.map((post) => {
          const postPath = `posts/${post.slug}`;
          const isActive = currentPath === postPath;

          return (
            <button
              key={post.slug}
              className="w-full text-left cursor-pointer block"
              style={{
                paddingLeft: "28px",
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
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span>·</span>
                <span>{estimateReadingTime(post.description)} min read</span>
              </div>
            </button>
          );
        })}
    </div>
  );
}
