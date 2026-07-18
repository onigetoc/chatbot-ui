import { useEffect, useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { SettingsPanel } from './components/SettingsPanel'
import { useChatStore } from './store/chatStore'
import './index.css'

export type AppView = 'chat' | 'settings'

export default function App() {
  const theme = useChatStore((state) => state.theme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<AppView>('chat')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <div className={`flex h-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => {
          setView('settings')
          setSidebarOpen(false)
        }}
        currentView={view}
      />
      <main className="relative flex-1 overflow-hidden">
        {view === 'chat' && (
          <>
            <button
              onClick={() => setSidebarOpen(true)}
              className={`absolute left-4 top-4 z-20 rounded-md p-2 transition-colors md:hidden ${
                isDark
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
              aria-label="Open sidebar"
            >
              <PanelLeft size={20} />
            </button>
            <ChatArea theme={theme} />
          </>
        )}
        {view === 'settings' && (
          <SettingsPanel theme={theme} onClose={() => setView('chat')} />
        )}
      </main>
    </div>
  )
}
