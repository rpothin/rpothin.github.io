import { FileExplorer } from "./FileExplorer";
import { SearchPanel } from "./SearchPanel";

interface SidebarProps {
  activeView: "explorer" | "search";
  visible: boolean;
  currentPath: string;
}

export function Sidebar({ activeView, visible, currentPath }: SidebarProps) {
  if (!visible) return null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 250,
        minWidth: 250,
        backgroundColor: "var(--vscode-sideBar-background)",
      }}
    >
      <div
        className="px-4 py-2 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--vscode-tab-inactiveForeground)" }}
      >
        {activeView === "explorer" ? "Explorer" : "Search"}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === "explorer" ? (
          <FileExplorer currentPath={currentPath} />
        ) : (
          <SearchPanel />
        )}
      </div>
    </div>
  );
}
