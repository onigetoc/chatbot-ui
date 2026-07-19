import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import type { ThemeMode } from '../store/chatStore'
import type { Message } from '../types'

interface Props {
  messages: Message[]
  theme: ThemeMode
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

/** Sub-component that scrolls to the active item on mount */
function TocPopup({
  userMessages,
  activeMessageId,
  isDark,
  onScrollToMessage,
}: {
  userMessages: Message[]
  activeMessageId: string | null
  isDark: boolean
  onScrollToMessage: (id: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeMessageId || !listRef.current) return
    const activeBtn = listRef.current.querySelector(`[data-toc-id="${activeMessageId}"]`)
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'center' })
    }
  }, []) // only on mount

  return (
    <div
      ref={listRef}
      className={`toc-scroll absolute right-0 max-h-[70vh] w-72 overflow-y-auto rounded-xl border px-2 py-2 shadow-lg ${
        isDark
          ? 'border-zinc-700 bg-zinc-900'
          : 'border-zinc-200 bg-white shadow-md'
      }`}
    >
      {userMessages.map((msg) => (
        <button
          key={msg.id}
          type="button"
          data-toc-id={msg.id}
          onClick={() => onScrollToMessage(msg.id)}
          className={`w-full rounded-lg px-3 py-2 text-left text-xs truncate transition-colors ${
            msg.id === activeMessageId
              ? isDark
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-100 text-zinc-900 font-medium'
              : isDark
                ? 'text-zinc-300 hover:bg-zinc-800'
                : 'text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          {msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content}
        </button>
      ))}
    </div>
  )
}

export const ChatTOC = memo(function ChatTOC({ messages, theme, scrollContainerRef }: Props) {
  const [showList, setShowList] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const isDark = theme === 'dark'

  // Memoize filtered user messages to avoid new array reference every render
  const userMessages = useMemo(
    () => messages.filter((m) => m.role === 'user'),
    [messages],
  )

  // Keep a ref to userMessages for the scroll handler (avoids re-subscribing on every change)
  const userMessagesRef = useRef(userMessages)
  userMessagesRef.current = userMessages

  // Track which user message is currently in view (throttled)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let rafId: number | null = null

    function updateActiveMessage() {
      rafId = null
      const msgs = userMessagesRef.current
      if (!container || msgs.length === 0) return

      const containerRect = container.getBoundingClientRect()
      const viewportMiddle = containerRect.top + containerRect.height / 2

      let closestId: string | null = null
      let closestDistance = Infinity

      for (const msg of msgs) {
        const el = container.querySelector(`[data-message-id="${msg.id}"]`)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const msgMiddle = rect.top + rect.height / 2
        const distance = Math.abs(msgMiddle - viewportMiddle)

        // Only consider messages that are at least partially visible
        if (rect.bottom >= containerRect.top && rect.top <= containerRect.bottom) {
          if (distance < closestDistance) {
            closestDistance = distance
            closestId = msg.id
          }
        }
      }

      // If none visible, find the last one above the viewport
      if (!closestId) {
        for (let i = msgs.length - 1; i >= 0; i--) {
          const el = container.querySelector(`[data-message-id="${msgs[i].id}"]`)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          if (rect.bottom <= containerRect.bottom) {
            closestId = msgs[i].id
            break
          }
        }
      }

      if (closestId) {
        setActiveMessageId(closestId)
      }
    }

    // Throttle via rAF — fires at most once per frame (~16ms) instead of every scroll pixel
    function handleScroll() {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateActiveMessage)
      }
    }

    updateActiveMessage()
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [scrollContainerRef])

  const scrollToMessage = useCallback((messageId: string) => {
    const container = scrollContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-message-id="${messageId}"]`)
    if (el) {
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const offsetTop = elRect.top - containerRect.top + container.scrollTop
      // Scroll so the message sits near the top with 10px breathing room
      container.scrollTo({ top: offsetTop - 10, behavior: 'smooth' })
    }
    setShowList(false)
  }, [scrollContainerRef])

  if (userMessages.length < 2) return null

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30"
      onMouseEnter={() => setShowList(true)}
      onMouseLeave={() => setShowList(false)}
    >
      <div className="relative flex items-center">
        {/* Popup list */}
        {showList && (
          <TocPopup
            userMessages={userMessages}
            activeMessageId={activeMessageId}
            isDark={isDark}
            onScrollToMessage={scrollToMessage}
          />
        )}

        {/* Bars */}
        {!showList && (
          <div className="flex flex-col items-center gap-[6px] px-1.5 py-2">
            {userMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-full transition-colors ${
                  msg.id === activeMessageId
                    ? isDark ? 'bg-zinc-300' : 'bg-zinc-600'
                    : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                }`}
                style={{ width: '20px', height: '2px' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
