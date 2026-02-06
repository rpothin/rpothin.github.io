import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { PostMeta } from '../types';

interface PostPageProps {
  onMeta: (meta: { title: string; path: string; readingTime: number }) => void;
}

export function PostPage({ onMeta }: PostPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState('');
  const [meta, setMeta] = useState<PostMeta | null>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/content/posts/${slug}.html`)
      .then((r) => r.text())
      .then((content) => {
        setHtml(content);
        const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
        const readingTime = Math.max(1, Math.round(wordCount / 200));

        fetch('/posts-meta.json')
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
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {meta && (
        <div className="mb-6">
          <div className="flex items-center gap-3 text-sm mb-4" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
            {meta.date && <time>{new Date(meta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>}
          </div>
          {meta.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {meta.tags.map((tag) => (
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
        </div>
      )}
      <MarkdownRenderer html={html} />
    </div>
  );
}
