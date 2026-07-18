import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Pencil } from 'lucide-react'
import { useChatStore, type ThemeMode } from '../store/chatStore'
import { IconTooltip } from './IconTooltip'

interface Props {
  theme: ThemeMode
}

export function ChatHeader({ theme }: Props) {
  const { activeId, conversations, renameConversation } = useChatStore()
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId)
  const title = activeConversation?.title || t('chat.newChat')
  const messages = activeConversation?.messages || []

  const isDark = theme === 'dark'

  function startEditing() {
    setDraft(title)
    setIsEditing(true)
  }

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && activeId && trimmed !== title) {
      renameConversation(activeId, trimmed)
    }
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  async function copyConversation() {
    if (messages.length === 0) return

    const markdown = messages
      .map((m) => {
        const role = m.role === 'user' ? '**User**' : '**Assistant**'
        return `${role}:\n\n${m.content}`
      })
      .join('\n\n---\n\n')

    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  return (
    <div
      className={`flex h-12 shrink-0 items-center justify-between border-b px-4 ${
        isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-100'
      }`}
    >
      {/* Left: title + edit */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className={`rounded border px-2 py-0.5 text-sm font-medium outline-none ${
              isDark
                ? 'border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-blue-500'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-blue-500'
            }`}
            maxLength={100}
            aria-label={t('chat.renameConversation')}
          />
        ) : (
          <>
            <h1
              className={`text-sm font-medium truncate max-w-[300px] ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              {title}
            </h1>
            <button
              type="button"
              onClick={startEditing}
              aria-label={t('chat.editConversationName')}
              className={`rounded p-1 transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
              }`}
            >
              <Pencil size={14} />
            </button>
          </>
        )}
      </div>

      {/* Right: copy conversation */}
      {messages.length > 0 && (
        <IconTooltip label={t('chat.copyConversation')}>
          <button
            type="button"
            onClick={copyConversation}
            aria-label={t('chat.copyConversation')}
            className={`rounded p-1.5 transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
            }`}
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        </IconTooltip>
      )}
    </div>
  )
}
