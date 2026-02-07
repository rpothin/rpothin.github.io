import { useState, useCallback, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ActivityBar } from "./components/ActivityBar";
import { Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import type { Tab } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { HomePage } from "./pages/HomePage";
import { PostPage } from "./pages/PostPage";
import { AboutPage } from "./pages/AboutPage";
import { useTheme } from "./hooks/useTheme";

interface PageMeta {
  title: string;
  path: string;
  readingTime: number;
}

const WELCOME_TAB: Tab = {
  id: "welcome",
  title: "Welcome",
  path: "/",
};

function routeToTabId(pathname: string): string {
  if (pathname === "/about") return "about";
  if (pathname.startsWith("/posts/"))
    return `posts/${pathname.replace("/posts/", "")}`;
  return "welcome";
}

function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarView, setSidebarView] = useState<"explorer" | "search">(
    "explorer",
  );
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [pageMeta, setPageMeta] = useState<PageMeta>({
    title: "Welcome",
    path: "",
    readingTime: 0,
  });
  const [tabs, setTabs] = useState<Tab[]>([WELCOME_TAB]);
  const [activeTabId, setActiveTabId] = useState("welcome");
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath =
    location.pathname === "/about"
      ? "about"
      : location.pathname.startsWith("/posts/")
        ? `posts/${location.pathname.replace("/posts/", "")}`
        : "";

  // Sync tabs with navigation
  useEffect(() => {
    const tabId = routeToTabId(location.pathname);
    setActiveTabId(tabId);
  }, [location.pathname]);

  const handleMeta = useCallback((meta: PageMeta) => {
    setPageMeta(meta);
    // Update or create tab for this page
    const tabId = meta.path ? meta.path : "welcome";
    const route = meta.path
      ? meta.path === "about"
        ? "/about"
        : `/${meta.path}`
      : "/";

    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tabId);
      if (existing) {
        // Update title if changed
        if (existing.title !== meta.title) {
          return prev.map((t) =>
            t.id === tabId ? { ...t, title: meta.title } : t,
          );
        }
        return prev;
      }
      return [...prev, { id: tabId, title: meta.title, path: route }];
    });
    setActiveTabId(tabId);
  }, []);

  const handleSelectTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        navigate(tab.path);
      }
    },
    [tabs, navigate],
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (newTabs.length === 0) {
          // No tabs left — go back to Welcome
          navigate("/");
          return [WELCOME_TAB];
        }
        // If closing the active tab, switch to adjacent
        if (tabId === activeTabId) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
          navigate(nextTab.path);
        }
        return newTabs;
      });
    },
    [activeTabId, navigate],
  );

  const handleCloseOtherTabs = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const kept = prev.filter((t) => t.id === tabId);
        if (kept.length > 0) {
          navigate(kept[0].path);
          return kept;
        }
        navigate("/");
        return [WELCOME_TAB];
      });
    },
    [navigate],
  );

  const handleCloseAllTabs = useCallback(() => {
    setTabs([WELCOME_TAB]);
    navigate("/");
  }, [navigate]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      <ActivityBar
        activeView={sidebarView}
        onViewChange={setSidebarView}
        onAbout={() => navigate("/about")}
        theme={theme}
        onToggleTheme={toggleTheme}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={() => setSidebarVisible((v) => !v)}
      />
      <Sidebar
        activeView={sidebarView}
        visible={sidebarVisible}
        currentPath={currentPath}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onCloseOtherTabs={handleCloseOtherTabs}
          onCloseAllTabs={handleCloseAllTabs}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage onMeta={handleMeta} />} />
            <Route path="/about" element={<AboutPage onMeta={handleMeta} />} />
            <Route
              path="/posts/:slug"
              element={<PostPage onMeta={handleMeta} />}
            />
          </Routes>
        </main>
        <StatusBar
          filePath={pageMeta.path}
          readingTime={pageMeta.readingTime || undefined}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}

export default App;
