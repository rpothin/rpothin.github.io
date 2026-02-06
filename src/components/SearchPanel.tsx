import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';

export function SearchPanel() {
  const { query, setQuery, results, isLoading } = useSearch();
  const navigate = useNavigate();

  const handleResultClick = (ref: string) => {
    if (ref === 'about') {
      navigate('/about');
    } else if (ref.startsWith('posts/')) {
      const slug = ref.replace('posts/', '');
      navigate(`/posts/${slug}`);
    }
  };

  return (
    <div className="p-2">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-2 py-1 text-sm rounded-none border-none outline-none"
        style={{
          backgroundColor: 'var(--vscode-input-background)',
          color: 'var(--vscode-input-foreground)',
        }}
      />
      <div className="mt-2">
        {isLoading && (
          <div className="text-xs px-2" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
            Loading index...
          </div>
        )}
        {!isLoading && query && results.length === 0 && (
          <div className="text-xs px-2" style={{ color: 'var(--vscode-tab-inactiveForeground)' }}>
            No results found
          </div>
        )}
        {results.map((r) => (
          <button
            key={r.ref}
            className="w-full text-left px-2 py-1.5 text-sm cursor-pointer block"
            style={{ color: 'var(--vscode-editor-foreground)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--vscode-list-hoverBackground)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            onClick={() => handleResultClick(r.ref)}
          >
            <div className="font-medium truncate">{r.title}</div>
            {r.description && (
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: 'var(--vscode-tab-inactiveForeground)' }}
              >
                {r.description}
              </div>
            )}
            {r.date && (
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--vscode-tab-inactiveForeground)' }}
              >
                {r.date}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
