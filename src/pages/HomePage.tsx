import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PostMeta } from '../types';

interface HomePageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function HomePage({ onMeta }: HomePageProps) {
  const [posts, setPosts] = useState<PostMeta[]>([]);

  useEffect(() => {
    onMeta({ title: 'Welcome', path: '', readingTime: 0 });
    fetch('/posts-meta.json')
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
  }, [onMeta]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--vscode-editor-foreground)' }}>
          Welcome
        </h1>
        <p className="text-lg" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
          A VS Code-themed developer blog about Power Platform, GitHub, and open source.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--vscode-editor-foreground)' }}>
        Recent Posts
      </h2>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/posts/${post.slug}`}
            className="block p-4 rounded no-underline transition-colors"
            style={{ backgroundColor: 'var(--vscode-sideBar-background)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--vscode-list-hoverBackground)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--vscode-sideBar-background)')
            }
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-medium" style={{ color: 'var(--vscode-editor-foreground)' }}>
                {post.title}
              </h3>
              {post.date && (
                <time className="text-xs flex-shrink-0 ml-4" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              )}
            </div>
            {post.description && (
              <p className="text-sm mb-2" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
                {post.description}
              </p>
            )}
            {post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--vscode-badge-background)',
                      color: 'var(--vscode-badge-foreground)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
