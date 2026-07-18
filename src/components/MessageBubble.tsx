import { memo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Pencil, Send } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { IconTooltip } from './IconTooltip'
import type { ThemeMode } from '../store/chatStore'
import type { Message } from '../types'

interface Props {
  message: Message
  theme: ThemeMode
  onEditMessage?: (messageId: string, newContent: string) => void
}

function CopyButton({ text, isDark }: { text: string; isDark: boolean }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <IconTooltip label={t('chat.copyMessage')}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t('chat.copyMessage')}
        className={`rounded p-1 transition-colors ${
          isDark
            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
        }`}
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </IconTooltip>
  )
}

export function MessageBubble({ message, theme, onEditMessage }: Props) {
  const { t } = useTranslation()
  const isUser = message.role === 'user'
  const isDark = theme === 'dark'
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  function startEditing() {
    setEditDraft(message.content)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  function submitEdit() {
    const trimmed = editDraft.trim()
    if (trimmed && trimmed !== message.content && onEditMessage) {
      onEditMessage(message.id, trimmed)
    }
    setIsEditing(false)
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  if (isUser) {
    return (
      <div className="group flex flex-col items-end mb-4">
        {isEditing ? (
          <div className={`w-full max-w-[82%] rounded-2xl px-4 py-3 ${isDark ? 'bg-zinc-800' : 'bg-white ring-1 ring-zinc-300 shadow-sm'}`}>
            <textarea
              ref={textareaRef}
              value={editDraft}
              onChange={(e) => {
                setEditDraft(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              onKeyDown={handleEditKeyDown}
              className={`w-full resize-none bg-transparent text-[0.98rem] leading-7 outline-none ${isDark ? 'text-white' : 'text-zinc-900'}`}
              rows={1}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {t('chat.cancel')}
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={!editDraft.trim() || editDraft.trim() === message.content}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  !editDraft.trim() || editDraft.trim() === message.content
                    ? 'cursor-not-allowed opacity-40'
                    : ''
                } ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}
              >
                <Send size={12} />
                {t('chat.resend')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`max-w-[82%] rounded-2xl rounded-tr-sm px-5 py-3 text-[0.98rem] leading-7 whitespace-pre-wrap ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900 ring-1 ring-zinc-300 shadow-sm'}`}>
              {message.content}
            </div>
            {/* Action buttons */}
            <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton text={message.content} isDark={isDark} />
              {onEditMessage && (
                <IconTooltip label={t('chat.editMessage')}>
                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label={t('chat.editMessage')}
                    className={`rounded p-1 transition-colors ${
                      isDark
                        ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        : 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
                    }`}
                  >
                    <Pencil size={14} />
                  </button>
                </IconTooltip>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="group flex flex-col items-start mb-4">
      <div className={`max-w-[88%] text-[0.98rem] leading-7 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const isInline = !match
              if (isInline) {
                return (
                  <code
                    className={`rounded px-1.5 py-0.5 text-[0.88em] ${isDark ? 'bg-zinc-800 text-orange-300' : 'bg-zinc-200 text-amber-700'}`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <CodeBlock language={match[1]}>
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              )
            },
            p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 mt-2 list-disc space-y-2 pl-6">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 mt-2 list-decimal space-y-2 pl-6">{children}</ol>,
            li: ({ children }) => <li className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>{children}</li>,
            h1: ({ children }) => <h1 className={`mb-4 mt-6 text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{children}</h1>,
            h2: ({ children }) => <h2 className={`mb-4 mt-6 text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{children}</h2>,
            h3: ({ children }) => <h3 className={`mb-3 mt-5 text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className={`my-5 border-l-2 pl-4 italic ${isDark ? 'border-zinc-500 text-zinc-400' : 'border-zinc-300 text-zinc-600'}`}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-5 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                <table className="min-w-full border-collapse text-sm leading-6">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="!bg-zinc-300 dark:!bg-zinc-900/80 !text-zinc-900 dark:!text-zinc-100">{children}</thead>,
            tbody: ({ children }) => <tbody className={isDark ? 'divide-y divide-zinc-800 bg-transparent' : 'divide-y divide-zinc-200 bg-white'}>{children}</tbody>,
            tr: ({ children }) => <tr className={isDark ? 'align-top bg-transparent' : 'align-top bg-white even:bg-zinc-50/70'}>{children}</tr>,
            th: ({ children }) => (
              <th className={`border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'border-zinc-800 text-zinc-300' : 'border-zinc-200 text-zinc-600'}`}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className={`px-4 py-3 align-top ${isDark ? 'bg-transparent text-zinc-200' : 'bg-transparent text-zinc-700'}`}>
                {children}
              </td>
            ),
            hr: () => <hr className={`my-6 border-0 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className={isDark ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'}>
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
      {/* Action buttons */}
      <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={message.content} isDark={isDark} />
      </div>
    </div>
  )
}

function areMessageBubblePropsEqual(prev: Props, next: Props) {
  return (
    prev.theme === next.theme
    && prev.message.id === next.message.id
    && prev.message.role === next.message.role
    && prev.message.content === next.message.content
    && prev.onEditMessage === next.onEditMessage
  )
}

export const MemoizedMessageBubble = memo(MessageBubble, areMessageBubblePropsEqual)

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-1.5 rounded-2xl bg-zinc-800 px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export const MemoizedTypingIndicator = memo(TypingIndicator)
