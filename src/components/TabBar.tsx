import { useState, useRef, useEffect, useCallback } from "react";

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
  const tabListRef = useRef<HTMLDivElement>(null);

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

  // Close context menu on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && contextMenu) {
        setContextMenu(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [contextMenu]);

  // Arrow-key navigation between tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tabId: string) => {
      const currentIndex = tabs.findIndex((t) => t.id === tabId);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        onSelectTab(tabs[nextIndex].id);
        // Move focus to the newly selected tab element
        const tabEls =
          tabListRef.current?.querySelectorAll<HTMLElement>("[role='tab']");
        tabEls?.[nextIndex]?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        onSelectTab(tabs[prevIndex].id);
        const tabEls =
          tabListRef.current?.querySelectorAll<HTMLElement>("[role='tab']");
        tabEls?.[prevIndex]?.focus();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onCloseTab(tabId);
      }
    },
    [tabs, onSelectTab, onCloseTab],
  );

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Open tabs"
      className="flex items-center h-9 overflow-x-auto relative"
      style={{ backgroundColor: "var(--vscode-tab-inactiveBackground)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            id={`tab-${tab.id}`}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectTab(tab.id);
              } else {
                handleTabKeyDown(e, tab.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
            }}
          >
            <span className="text-xs" aria-hidden="true">
              📄
            </span>
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
              title={`Close ${tab.title}`}
              aria-label={`Close ${tab.title}`}
              tabIndex={-1}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Tab options"
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
            role="menuitem"
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
            role="menuitem"
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
            role="menuitem"
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
