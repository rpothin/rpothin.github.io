interface StatusBarProps {
  filePath: string;
  readingTime?: number;
}

export function StatusBar({ filePath, readingTime }: StatusBarProps) {
  return (
    <footer
      role="contentinfo"
      aria-label="Status bar"
      className="flex items-center justify-between px-3 text-xs h-6 flex-shrink-0"
      style={{
        backgroundColor: "var(--vscode-statusBar-background)",
        color: "var(--vscode-statusBar-foreground)",
      }}
    >
      <div className="flex items-center gap-3">
        <span>{filePath || "Welcome"}</span>
        {readingTime !== undefined && (
          <>
            <span aria-hidden="true" style={{ opacity: 0.6 }}>
              |
            </span>
            <span>
              <span aria-hidden="true">☕ </span>
              {readingTime} min read
            </span>
          </>
        )}
      </div>
      <div className="flex items-center">
        <a
          href="https://github.com/rpothin/rpothin.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center gap-1"
          aria-label="See source on GitHub (opens in new tab)"
          style={{ color: "var(--vscode-statusBar-foreground)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58 0-.28-.01-1.02-.02-2.01-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.19.7.8.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          See on GitHub
        </a>
      </div>
    </footer>
  );
}
