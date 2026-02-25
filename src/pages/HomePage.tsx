import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { PostMeta } from "../types";

interface HomePageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function HomePage({ onMeta }: HomePageProps) {
  const [posts, setPosts] = useState<PostMeta[]>([]);

  useEffect(() => {
    onMeta({ title: "Welcome", path: "", readingTime: 0 });
    fetch("/posts-meta.json")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
  }, [onMeta]);

  const recentPosts = posts.slice(0, 3);

  return (
    <div className="flex items-start justify-center min-h-full py-12 px-4">
      <div className="max-w-3xl w-full">
        {/* Welcome Banner */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl font-light mb-2"
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            Raphael Pothin's Blog
          </h1>
          <p
            className="text-base"
            style={{ color: "var(--vscode-tab-inactiveForeground)" }}
          >
            Power Platform, GitHub, and open source — in a VS Code-themed
            experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Quick Start / Navigation Guide */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--vscode-tab-inactiveForeground)" }}
            >
              Start
            </h2>
            <div className="space-y-2">
              <Link
                to="/posts/welcome"
                className="flex items-center gap-2 text-sm no-underline hover:underline"
                style={{ color: "#3794ff" }}
              >
                <span aria-hidden="true">📄</span>
                <span>Read the Welcome Post</span>
              </Link>
              <a
                href="/rss.xml"
                className="flex items-center gap-2 text-sm no-underline hover:underline"
                style={{ color: "#3794ff" }}
              >
                <span aria-hidden="true">📰</span>
                <span>Subscribe via RSS</span>
              </a>
              <Link
                to="/about"
                className="flex items-center gap-2 text-sm no-underline hover:underline"
                style={{ color: "#3794ff" }}
              >
                <span aria-hidden="true">👤</span>
                <span>About me</span>
              </Link>
              <Link
                to="/privacy"
                className="flex items-center gap-2 text-sm no-underline hover:underline"
                style={{ color: "#3794ff" }}
              >
                <span aria-hidden="true">🛡️</span>
                <span>Privacy &amp; Analytics</span>
              </Link>
            </div>
          </div>

          {/* Navigation Help */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--vscode-tab-inactiveForeground)" }}
            >
              Navigate
            </h2>
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--vscode-editor-foreground)" }}
              >
                <span aria-hidden="true">📂</span>
                <span>
                  Use the <strong>Explorer</strong> sidebar to browse posts
                </span>
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--vscode-editor-foreground)" }}
              >
                <span aria-hidden="true">🔍</span>
                <span>
                  Use <strong>Search</strong> to find content across all posts
                </span>
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--vscode-editor-foreground)" }}
              >
                <span aria-hidden="true">🌓</span>
                <span>
                  Toggle <strong>dark/light theme</strong> from the activity bar
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--vscode-tab-inactiveForeground)" }}
            >
              Recent
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/posts/${post.slug}`}
                  className="block p-4 rounded no-underline transition-colors border"
                  style={{
                    backgroundColor: "var(--vscode-sideBar-background)",
                    borderColor: "var(--vscode-badge-background)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--vscode-list-hoverBackground)";
                    e.currentTarget.style.borderColor =
                      "var(--vscode-statusBar-background)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--vscode-sideBar-background)";
                    e.currentTarget.style.borderColor =
                      "var(--vscode-badge-background)";
                  }}
                >
                  <h3
                    className="text-sm font-medium mb-2 line-clamp-2"
                    style={{ color: "var(--vscode-editor-foreground)" }}
                  >
                    {post.title}
                  </h3>
                  {post.description && (
                    <p
                      className="text-xs mb-3 line-clamp-2"
                      style={{ color: "var(--vscode-tab-inactiveForeground)" }}
                    >
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {post.date && (
                      <time
                        className="text-xs"
                        style={{
                          color: "var(--vscode-tab-inactiveForeground)",
                        }}
                      >
                        {new Date(post.date + "T12:00:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </time>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0 rounded"
                            style={{
                              backgroundColor: "var(--vscode-badge-background)",
                              color: "var(--vscode-badge-foreground)",
                              fontSize: "10px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
