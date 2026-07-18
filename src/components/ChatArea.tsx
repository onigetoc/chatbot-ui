import { memo, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, MessageSquare } from 'lucide-react'
import { useChat } from 'ai/react'
import { MemoizedMessageBubble, MemoizedTypingIndicator } from './MessageBubble'
import { ComposerBar, type FileAttachment } from './ComposerBar'
import { Toast } from './Toast'
import { IconTooltip } from './IconTooltip'
import { useChatStore, type ThemeMode } from '../store/chatStore'
import { ChatHeader } from './ChatHeader'
import { getStoredApiKey } from '../providers/frontend/ApiKeysSection'
import { getProviderBaseURL } from '../providers/frontend/models-cache'
import type { Message } from '../types'

interface Props {
  theme: ThemeMode
}

interface ChatMessageListProps {
  messages: Message[]
  theme: ThemeMode
  isLoading: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  onEditMessage?: (messageId: string, newContent: string) => void
}

const ChatMessageList = memo(function ChatMessageList({ messages, theme, isLoading, scrollRef, onEditMessage }: ChatMessageListProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {messages.map((message) => (
        <MemoizedMessageBubble
          key={message.id}
          message={message}
          theme={theme}
          onEditMessage={onEditMessage}
        />
      ))}
      {isLoading && <MemoizedTypingIndicator />}
      <div ref={scrollRef} />
    </div>
  )
})

function toStoreMessages(msgs: { id: string; role: string; content: string }[]): Message[] {
  return msgs
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
}

export function ChatArea({ theme }: Props) {
  const { activeId, conversations, selectedModel, createConversation, updateMessages, setActiveId } = useChatStore()
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(activeId)
  const latestStoreMessagesRef = useRef<Message[]>([])
  const composerContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [composerHeight, setComposerHeight] = useState(136)
  const [chatError, setChatError] = useState<string | null>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const computeIsNearBottom = () => {
    const container = scrollContainerRef.current
    if (!container) return true
    const canScroll = container.scrollHeight > container.clientHeight + 8
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return !canScroll || distanceFromBottom < 64
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior })
    setShowScrollToBottom(false)
  }

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id)
    }
  }, [activeId, conversations, setActiveId])

  // Resolve API key and base URL dynamically
  const getApiKeyForModel = (modelId: string): string => {
    const slashIdx = modelId.indexOf('/')
    const providerId = slashIdx !== -1 ? modelId.substring(0, slashIdx) : 'opencode'
    return getStoredApiKey(providerId) || ''
  }

  const getBaseURLForModel = (modelId: string): string => {
    const slashIdx = modelId.indexOf('/')
    const providerId = slashIdx !== -1 ? modelId.substring(0, slashIdx) : 'opencode'
    return getProviderBaseURL(providerId) || ''
  }

  // Stable initial messages — only recompute when activeId actually changes
  const initialMessagesRef = useRef<{ id: string; role: 'user' | 'assistant' | 'system'; content: string }[]>([])
  const lastLoadedIdRef = useRef<string | null>(null)

  if (activeId !== lastLoadedIdRef.current) {
    lastLoadedIdRef.current = activeId
    const conv = conversations.find((c) => c.id === activeId)
    initialMessagesRef.current = conv?.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })) ?? []
  }

  const { messages, input, setInput, setMessages, handleSubmit: rawHandleSubmit, isLoading, stop } = useChat({
    id: activeId || 'new',
    api: '/api/chat',
    initialMessages: initialMessagesRef.current,
    onError: (error) => {
      console.error('[chat] useChat error:', error.message)
      setChatError((prev) => prev ? prev : (error.message || 'An error occurred'))
    },
    onFinish: () => {
      const conversationId = activeIdRef.current
      if (conversationId) {
        updateMessages(conversationId, latestStoreMessagesRef.current)
      }
    },
  })

  // Wrap handleSubmit to always send fresh body with current model + key + baseURL
  const handleSubmit = (e: FormEvent, attachments?: FileAttachment[]) => {
    setChatError(null)
    const options: Record<string, unknown> = {
      body: {
        model: selectedModel,
        apiKey: getApiKeyForModel(selectedModel),
        baseURL: getBaseURLForModel(selectedModel),
      },
    }
    if (attachments && attachments.length > 0) {
      options.experimental_attachments = attachments.map((a) => ({
        name: a.name,
        contentType: a.contentType,
        url: a.url,
      }))
    }
    rawHandleSubmit(e, options)
  }

  const displayMessages = useMemo(
    () => messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })),
    [messages],
  )

  // Keep ref up to date for onFinish callback
  useEffect(() => {
    latestStoreMessagesRef.current = toStoreMessages(messages)
  }, [messages])

  // Track whether the user has scrolled away from the latest message.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const nearBottom = computeIsNearBottom()
      const canScroll = container.scrollHeight > container.clientHeight + 8
      setIsNearBottom(nearBottom)
      setShowScrollToBottom(canScroll && !nearBottom)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll only if the user is already near the bottom.
  useEffect(() => {
    const container = scrollContainerRef.current
    const canScroll = !!container && container.scrollHeight > container.clientHeight + 8

    if (isNearBottom) {
      scrollToBottom(messages.length > 1 ? 'auto' : 'smooth')
    } else {
      setShowScrollToBottom(canScroll)
    }
  }, [messages, isLoading, isNearBottom])

  // Keep the floating button above the composer, even when textarea grows.
  useEffect(() => {
    const node = composerContainerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setComposerHeight(Math.round(entry.contentRect.height))
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const [pendingSubmit, setPendingSubmit] = useState(false)
  const pendingAttachments = useRef<FileAttachment[] | undefined>(undefined)

  function handleSend(attachments?: FileAttachment[]) {
    if (!input.trim() && (!attachments || attachments.length === 0)) return
    pendingAttachments.current = attachments
    // Create conversation on first message
    if (!activeId) {
      createConversation()
      setPendingSubmit(true)
      return
    }
    handleSubmit(new Event('submit') as unknown as FormEvent, attachments)
    pendingAttachments.current = undefined
  }

  // Submit after conversation is created
  useEffect(() => {
    if (pendingSubmit && activeId) {
      setPendingSubmit(false)
      handleSubmit(new Event('submit') as unknown as FormEvent, pendingAttachments.current)
      pendingAttachments.current = undefined
    }
  }, [pendingSubmit, activeId, handleSubmit])

  const showEmpty = messages.length === 0 && !isLoading

  // Edit + resend: truncate conversation at the edited message and resend
  function handleEditMessage(messageId: string, newContent: string) {
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    if (msgIndex === -1) return

    // Keep messages up to (but not including) the edited message
    const truncated = messages.slice(0, msgIndex)
    setMessages(truncated)

    // Set the new content as input and trigger a submit
    setInput(newContent)
    setTimeout(() => {
      handleSubmit(new Event('submit') as unknown as FormEvent)
    }, 0)
  }

  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
      {/* Header */}
      <ChatHeader theme={theme} />

      {/* Messages */}
      <div ref={scrollContainerRef} className="chat-scroll relative flex-1 overflow-y-auto px-4 py-8">
        {showEmpty ? (
          <div className={`flex h-full flex-col items-center justify-center text-center ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            <MessageSquare size={48} className="mb-4 opacity-30" />
            <p className="text-base">{t('chat.startConversation')}</p>
            <p className="mt-1 text-sm opacity-60">{t('chat.selectModelHint')}</p>
          </div>
        ) : (
          <ChatMessageList
            messages={displayMessages}
            theme={theme}
            isLoading={isLoading}
            scrollRef={scrollRef}
            onEditMessage={handleEditMessage}
          />
        )}

      </div>

      {showScrollToBottom && !showEmpty && (
        <div
          className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
          style={{ bottom: composerHeight + 12 }}
        >
          <IconTooltip label={t('chat.scrollToBottom')}>
            <button
              type="button"
              onClick={() => scrollToBottom()}
              aria-label={t('chat.scrollToBottom')}
              className={`pointer-events-auto rounded-full border p-3 shadow-lg backdrop-blur transition ${isDark ? 'border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700' : 'border-zinc-300 bg-white/95 text-zinc-700 hover:bg-zinc-100'}`}
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          </IconTooltip>
        </div>
      )}

      {/* Composer */}
      <div ref={composerContainerRef}>
        <ComposerBar
          input={input}
          setInput={setInput}
          onSubmit={handleSend}
          isLoading={isLoading}
          onStop={stop}
          theme={theme}
        />
      </div>

      {/* Error toast */}
      {chatError && (
        <Toast
          message={chatError}
          type="error"
          theme={theme}
          onDismiss={() => setChatError(null)}
        />
      )}
    </div>
  )
}
