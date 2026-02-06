import { useState, useCallback } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ActivityBar } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { TabBar } from './components/TabBar'
import { StatusBar } from './components/StatusBar'
import { HomePage } from './pages/HomePage'
import { PostPage } from './pages/PostPage'
import { AboutPage } from './pages/AboutPage'
import { useTheme } from './hooks/useTheme'

interface PageMeta {
  title: string
  path: string
  readingTime: number
}

function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search'>('explorer')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [pageMeta, setPageMeta] = useState<PageMeta>({ title: 'Welcome', path: '', readingTime: 0 })
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname === '/about'
    ? 'about'
    : location.pathname.startsWith('/posts/')
      ? `posts/${location.pathname.replace('/posts/', '')}`
      : ''

  const handleMeta = useCallback((meta: PageMeta) => {
    setPageMeta(meta)
  }, [])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--vscode-editor-background)' }}
    >
      <ActivityBar
        activeView={sidebarView}
        onViewChange={setSidebarView}
        onAbout={() => navigate('/about')}
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
        <TabBar title={pageMeta.title} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage onMeta={handleMeta} />} />
            <Route path="/about" element={<AboutPage onMeta={handleMeta} />} />
            <Route path="/posts/:slug" element={<PostPage onMeta={handleMeta} />} />
          </Routes>
        </main>
        <StatusBar filePath={pageMeta.path} readingTime={pageMeta.readingTime || undefined} />
      </div>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  )
}

export default App
