import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message } from '../types'

export type ThemeMode = 'dark' | 'light'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

interface ChatStore {
  conversations: Conversation[]
  activeId: string | null
  selectedModel: string
  theme: ThemeMode
  setActiveId: (id: string | null) => void
  setSelectedModel: (model: string) => void
  toggleTheme: () => void
  createConversation: () => string
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  updateMessages: (id: string, messages: Message[]) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      selectedModel: 'gemini-3.1-flash-lite',
      theme: 'dark',

      setActiveId: (id) => set({ activeId: id }),

      setSelectedModel: (model) => set({ selectedModel: model }),

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      createConversation: () => {
        const id = uid()
        const conv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().selectedModel,
        }

        set((state) => ({ conversations: [conv, ...state.conversations], activeId: id }))
        return id
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id !== id ? conversation : { ...conversation, title, updatedAt: Date.now() }
          ),
        }))
      },

      deleteConversation: (id) => {
        set((state) => {
          const rest = state.conversations.filter((conversation) => conversation.id !== id)
          return {
            conversations: rest,
            activeId: state.activeId === id ? (rest[0]?.id ?? null) : state.activeId,
          }
        })
      },

      updateMessages: (id, messages) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id !== id
              ? conversation
              : {
                  ...conversation,
                  messages,
                  updatedAt: Date.now(),
                  title:
                    messages.find((message) => message.role === 'user')?.content.slice(0, 50) ??
                    conversation.title,
                }
          ),
        }))
      },
    }),
    {
      name: 'chatbot-ui-snapshot',
      partialize: (state) => ({
        conversations: state.conversations,
        activeId: state.activeId,
        selectedModel: state.selectedModel,
        theme: state.theme,
      }),
    }
  )
)
