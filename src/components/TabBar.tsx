interface TabBarProps {
  title: string;
}

export function TabBar({ title }: TabBarProps) {
  return (
    <div
      className="flex items-center h-9 overflow-x-auto"
      style={{ backgroundColor: 'var(--vscode-tab-inactiveBackground)' }}
    >
      <div
        className="flex items-center gap-2 px-4 h-full text-sm whitespace-nowrap border-t-0"
        style={{
          backgroundColor: 'var(--vscode-tab-activeBackground)',
          color: 'var(--vscode-tab-activeForeground)',
          borderBottom: '1px solid var(--vscode-tab-activeBackground)',
        }}
      >
        <span>📄</span>
        <span>{title}</span>
      </div>
    </div>
  );
}
