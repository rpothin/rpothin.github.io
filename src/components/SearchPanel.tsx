import { useNavigate } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";

export function SearchPanel() {
  const { query, setQuery, results, isLoading } = useSearch();
  const navigate = useNavigate();

  const handleResultClick = (ref: string) => {
    if (ref === "about") {
      navigate("/about");
    } else if (ref.startsWith("posts/")) {
      const slug = ref.replace("posts/", "");
      navigate(`/posts/${slug}`);
    } else if (ref.startsWith("archive/")) {
      navigate(`/${ref}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 shrink-0">
        <input
          type="search"
          placeholder="Search..."
          aria-label="Search posts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-2 py-1 text-sm rounded-none border-none outline-none"
          style={{
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
          }}
        />
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {!isLoading && query && results.length === 0
          ? "No results found"
          : !isLoading && query && results.length > 0
            ? `${results.length} result${results.length === 1 ? "" : "s"} found`
            : ""}
      </div>
      <div
        className="flex-1 overflow-y-auto px-2 pb-2"
        role="list"
        aria-label="Search results"
      >
        {isLoading && (
          <div
            className="text-xs px-2"
            role="status"
            style={{ color: "var(--vscode-tab-inactiveForeground)" }}
          >
            Loading index...
          </div>
        )}
        {!isLoading && query && results.length === 0 && (
          <div
            className="text-xs px-2"
            style={{ color: "var(--vscode-tab-inactiveForeground)" }}
          >
            No results found
          </div>
        )}
        {results.map((r) => (
          <button
            key={r.ref}
            role="listitem"
            className="w-full text-left px-2 py-1.5 text-sm cursor-pointer block"
            style={{ color: "var(--vscode-editor-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--vscode-list-hoverBackground)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            onClick={() => handleResultClick(r.ref)}
          >
            <div className="font-medium truncate">{r.title}</div>
            {r.description && (
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--vscode-tab-inactiveForeground)" }}
              >
                {r.description}
              </div>
            )}
            {r.date && (
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--vscode-tab-inactiveForeground)" }}
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
