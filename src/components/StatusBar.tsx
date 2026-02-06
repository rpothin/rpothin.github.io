interface StatusBarProps {
  filePath: string;
  readingTime?: number;
}

export function StatusBar({ filePath, readingTime }: StatusBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 text-xs h-6 flex-shrink-0"
      style={{
        backgroundColor: 'var(--vscode-statusBar-background)',
        color: 'var(--vscode-statusBar-foreground)',
      }}
    >
      <div className="flex items-center gap-3">
        <span>{filePath || 'Welcome'}</span>
      </div>
      <div className="flex items-center gap-3">
        {readingTime !== undefined && <span>{readingTime} min read</span>}
        <a
          href="https://github.com/rpothin/rpothin.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: 'var(--vscode-statusBar-foreground)' }}
        >
          Edit on GitHub
        </a>
      </div>
    </div>
  );
}
