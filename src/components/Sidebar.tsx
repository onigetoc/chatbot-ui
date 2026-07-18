import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquarePlus, MoonStar, MoreHorizontal, Pencil, Settings, SunMedium, Trash2 } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { IconTooltip } from './IconTooltip'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

function ConversationContextMenu({
  conversationId,
  isDark,
  onClose,
}: {
  conversationId: string
  isDark: boolean
  onClose: () => void
}) {
  const { deleteConversation, renameConversation, conversations } = useChatStore()
  const { t } = useTranslation()
  const [isRenaming, setIsRenaming] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const conv = conversations.find((c) => c.id === conversationId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  function startRename() {
    setDraft(conv?.title || '')
    setIsRenaming(true)
  }

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== conv?.title) {
      renameConversation(conversationId, trimmed)
    }
    onClose()
  }

  if (isRenaming) {
    return (
      <div ref={menuRef} className={`absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border p-2 shadow-lg ${
        isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename() }
            if (e.key === 'Escape') onClose()
          }}
          className={`w-full rounded border px-2 py-1 text-sm outline-none ${
            isDark
              ? 'border-zinc-600 bg-zinc-900 text-zinc-100 focus:border-blue-500'
              : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-blue-500'
          }`}
          maxLength={100}
          aria-label="Rename conversation"
        />
      </div>
    )
  }

  return (
    <div ref={menuRef} className={`absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border py-1 shadow-lg ${
      isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'
    }`}>
      <button
        onClick={(e) => { e.stopPropagation(); startRename() }}
        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
          isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-100'
        }`}
      >
        <Pencil size={14} />
        <span>{t('sidebar.editChatName')}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); deleteConversation(conversationId); onClose() }}
        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
          isDark ? 'text-red-400 hover:bg-zinc-700' : 'text-red-500 hover:bg-zinc-100'
        }`}
      >
        <Trash2 size={14} />
        <span>{t('sidebar.delete')}</span>
      </button>
    </div>
  )
}

export function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const {
    conversations,
    activeId,
    createConversation,
    setActiveId,
    theme,
    toggleTheme,
  } = useChatStore()

  const { t } = useTranslation()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
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
          fixed inset-y-0 left-0 z-40 w-64
          md:static md:z-auto md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-300 bg-zinc-200'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          <span className="text-sm font-semibold">{t('sidebar.chats')}</span>
          <div className="flex items-center gap-1">
            <IconTooltip label={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')} side="bottom">
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className={`rounded-md p-1.5 transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
              </button>
            </IconTooltip>
            <IconTooltip label={t('sidebar.newChat')} side="bottom">
              <button
                onClick={() => {
                  createConversation()
                  onClose()
                }}
                aria-label={t('sidebar.newChat')}
                className={`rounded-md p-1.5 transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                <MessageSquarePlus size={16} />
              </button>
            </IconTooltip>
          </div>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 && (
            <p className={`px-3 py-2 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {t('sidebar.noConversations')}
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id)
                onClose()
              }}
              className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                conv.id === activeId
                  ? isDark
                    ? 'bg-zinc-800 text-white'
                    : 'bg-white text-zinc-900 shadow-sm'
                  : isDark
                    ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="truncate pr-6">{conv.title}</span>

              {/* Context menu trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpenId(menuOpenId === conv.id ? null : conv.id)
                }}
                aria-label={t('sidebar.chatOptions')}
                className={`absolute right-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                  menuOpenId === conv.id ? 'opacity-100' : ''
                } ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-700'}`}
              >
                <MoreHorizontal size={16} />
              </button>

              {/* Context menu */}
              {menuOpenId === conv.id && (
                <ConversationContextMenu
                  conversationId={conv.id}
                  isDark={isDark}
                  onClose={() => setMenuOpenId(null)}
                />
              )}
            </div>
          ))}
        </nav>

        {/* Settings button at bottom */}
        <div className={`border-t px-3 py-3 ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
          <button
            onClick={onOpenSettings}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Settings size={16} />
            <span>{t('sidebar.modelsAndSettings')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
