interface ActivityBarProps {
  activeView: "explorer" | "search";
  onViewChange: (view: "explorer" | "search") => void;
  onAbout: () => void;
  onPrivacy: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
}

export function ActivityBar({
  activeView,
  onViewChange,
  onAbout,
  onPrivacy,
  theme,
  onToggleTheme,
  sidebarVisible,
  onToggleSidebar,
}: ActivityBarProps) {
  const handleViewClick = (view: "explorer" | "search") => {
    if (activeView === view && sidebarVisible) {
      onToggleSidebar();
    } else {
      onViewChange(view);
      if (!sidebarVisible) onToggleSidebar();
    }
  };

  return (
    <nav
      aria-label="Activity bar"
      className="flex flex-col items-center justify-between h-full"
      style={{
        width: 48,
        backgroundColor: "var(--vscode-activityBar-background)",
        color: "var(--vscode-activityBar-foreground)",
      }}
    >
      <div
        className="flex flex-col items-center w-full"
        role="group"
        aria-label="Views"
      >
        <button
          onClick={() => handleViewClick("explorer")}
          className="w-full flex items-center justify-center py-3 relative hover:opacity-80"
          title="Explorer"
          aria-label="Explorer"
          aria-pressed={activeView === "explorer" && sidebarVisible}
          style={{
            borderLeft:
              activeView === "explorer" && sidebarVisible
                ? "2px solid var(--vscode-statusBar-background)"
                : "2px solid transparent",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
        <button
          onClick={() => handleViewClick("search")}
          className="w-full flex items-center justify-center py-3 relative hover:opacity-80"
          title="Search"
          aria-label="Search"
          aria-pressed={activeView === "search" && sidebarVisible}
          style={{
            borderLeft:
              activeView === "search" && sidebarVisible
                ? "2px solid var(--vscode-statusBar-background)"
                : "2px solid transparent",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>
      <div
        className="flex flex-col items-center pb-2"
        role="group"
        aria-label="Settings"
      >
        <button
          onClick={onAbout}
          className="w-full flex items-center justify-center py-3 hover:opacity-80"
          title="About"
          aria-label="About"
        >
          <img
            src="https://github.com/rpothin.png"
            alt=""
            aria-hidden="true"
            width="24"
            height="24"
            className="rounded-full"
            style={{
              border: "1px solid var(--vscode-activityBar-foreground)",
              opacity: 0.85,
            }}
          />
        </button>

        <button
          onClick={onPrivacy}
          className="w-full flex items-center justify-center py-3 hover:opacity-80"
          title="Privacy & Analytics"
          aria-label="Privacy & Analytics"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
        </button>

        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-center py-3 hover:opacity-80"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
