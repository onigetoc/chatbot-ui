import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import type { ThemeMode } from '../store/chatStore'
import type { Message } from '../types'

interface Props {
  message: Message
  theme: ThemeMode
}

export function MessageBubble({ message, theme }: Props) {
  const isUser = message.role === 'user'
  const isDark = theme === 'dark'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className={`max-w-[82%] rounded-2xl rounded-tr-sm px-5 py-3 text-[0.98rem] leading-7 whitespace-pre-wrap ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900 ring-1 ring-zinc-300 shadow-sm'}`}>
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4">
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
    </div>
  )
}

function areMessageBubblePropsEqual(prev: Props, next: Props) {
  return (
    prev.theme === next.theme
    && prev.message.id === next.message.id
    && prev.message.role === next.message.role
    && prev.message.content === next.message.content
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
