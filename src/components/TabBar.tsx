import { useState, useRef, useEffect } from "react";

export interface Tab {
  id: string;
  title: string;
  path: string; // route path like '/', '/about', '/posts/welcome'
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOtherTabs: (tabId: string) => void;
  onCloseAllTabs: () => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
}: TabBarProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div
      className="flex items-center h-9 overflow-x-auto relative"
      style={{ backgroundColor: "var(--vscode-tab-inactiveBackground)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className="group flex items-center gap-1 px-3 h-full text-sm whitespace-nowrap cursor-pointer select-none"
            style={{
              backgroundColor: isActive
                ? "var(--vscode-tab-activeBackground)"
                : "var(--vscode-tab-inactiveBackground)",
              color: isActive
                ? "var(--vscode-tab-activeForeground)"
                : "var(--vscode-tab-inactiveForeground)",
              borderBottom: isActive
                ? "1px solid var(--vscode-tab-activeBackground)"
                : "1px solid transparent",
              borderRight: "1px solid var(--vscode-editor-background)",
            }}
            onClick={() => onSelectTab(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
            }}
          >
            <span className="text-xs">📄</span>
            <span className="max-w-40 truncate">{tab.title}</span>
            {/* Close button - always visible for active tab, on hover for others */}
            <button
              className={`ml-1 w-4 h-4 flex items-center justify-center rounded-sm text-xs hover:bg-black/10 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{
                color: isActive
                  ? "var(--vscode-tab-activeForeground)"
                  : "var(--vscode-tab-inactiveForeground)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 py-1 rounded shadow-lg text-sm min-w-44"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            border: "1px solid var(--vscode-badge-background)",
          }}
        >
          <button
            className="w-full text-left px-3 py-1 hover:opacity-80"
            style={{ color: "var(--vscode-input-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--vscode-list-hoverBackground)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close
          </button>
          <button
            className="w-full text-left px-3 py-1 hover:opacity-80"
            style={{ color: "var(--vscode-input-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--vscode-list-hoverBackground)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            onClick={() => {
              onCloseOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close Others
          </button>
          <button
            className="w-full text-left px-3 py-1 hover:opacity-80"
            style={{ color: "var(--vscode-input-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--vscode-list-hoverBackground)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            onClick={() => {
              onCloseAllTabs();
              setContextMenu(null);
            }}
          >
            Close All
          </button>
        </div>
      )}
    </div>
  );
}
