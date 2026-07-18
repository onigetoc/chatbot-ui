import { MessageSquarePlus, MoonStar, Settings, SunMedium, Trash2 } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { IconTooltip } from './IconTooltip'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

export function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const {
    conversations,
    activeId,
    createConversation,
    deleteConversation,
    setActiveId,
    theme,
    toggleTheme,
  } =
    useChatStore()

  const isDark = theme === 'dark'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`flex h-full shrink-0 flex-col border-r transition-transform duration-300 ease-in-out
          fixed inset-y-0 left-0 z-40 w-72
          md:static md:z-auto md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-300 bg-zinc-200'}
        `}
      >
        <div className={`flex items-center justify-between px-5 py-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          <span className="text-base font-semibold tracking-wide">ChatBot</span>
          <div className="flex items-center gap-1">
            <IconTooltip label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} side="bottom">
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className={`rounded-md p-1.5 transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
              </button>
            </IconTooltip>
            <IconTooltip label="New chat" side="bottom">
              <button
                onClick={() => {
                  createConversation()
                  onClose()
                }}
                aria-label="New chat"
                className={`rounded-md p-1.5 transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                <MessageSquarePlus size={18} />
              </button>
            </IconTooltip>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 && <p className={`px-4 py-3 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>No conversations yet.</p>}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id)
                onClose()
              }}
              className={`group flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-base transition-colors ${
                conv.id === activeId
                  ? isDark
                    ? 'bg-zinc-800 text-white'
                    : 'bg-white text-zinc-900 ring-1 ring-zinc-300 shadow-sm'
                  : isDark
                    ? 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="truncate">{conv.title}</span>
              <IconTooltip label="Delete">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  aria-label="Delete"
                  className={`rounded p-1 opacity-0 transition-all group-hover:opacity-100 ${isDark ? 'hover:text-red-400' : 'hover:bg-zinc-200 hover:text-red-500'}`}
                >
                  <Trash2 size={14} />
                </button>
              </IconTooltip>
            </div>
          ))}
        </nav>

        {/* Settings button at bottom */}
        <div className={`border-t px-3 py-3 ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
          <button
            onClick={onOpenSettings}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Settings size={18} />
            <span>Models & Settings</span>
          </button>
        </div>
      </aside>
    </>
  )
}
