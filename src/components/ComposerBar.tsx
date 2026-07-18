import { useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Send, Square, Paperclip, Image as ImageIcon, Mic, Globe } from 'lucide-react'
import { ModelSelector } from './ModelSelector'
import { IconTooltip } from './IconTooltip'
import { useModels } from '../hooks/useModels'
import { useChatStore, type ThemeMode } from '../store/chatStore'

interface Props {
  input: string
  setInput: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  onStop: () => void
  theme: ThemeMode
}

function useRefocusOnLoad(textareaRef: React.RefObject<HTMLTextAreaElement | null>, isLoading: boolean) {
  const prevLoading = useRef(isLoading)
  useEffect(() => {
    if (prevLoading.current && !isLoading) {
      textareaRef.current?.focus()
    }
    prevLoading.current = isLoading
  }, [isLoading, textareaRef])
}

export function ComposerBar({ input, setInput, onSubmit, isLoading, onStop, theme }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { models } = useModels()
  const { selectedModel, setSelectedModel } = useChatStore()

  useRefocusOnLoad(textareaRef, isLoading)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [input])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) onSubmit()
    }
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'} px-4 pb-4 pt-3`}>
      <div className="mx-auto max-w-4xl">
        <div className={`flex flex-col gap-3 rounded-3xl px-4 py-4 transition-colors ${theme === 'dark' ? 'bg-zinc-900/40' : 'bg-white shadow-sm ring-1 ring-zinc-200'}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className={`min-h-[52px] max-h-[220px] resize-none bg-transparent text-[1rem] leading-7 outline-none placeholder:text-zinc-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
          />
          <div className="flex items-center justify-between gap-3">
            <div className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <IconTooltip label="Add files">
                <button type="button" aria-label="Add files" className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}>
                  <Paperclip size={16} />
                </button>
              </IconTooltip>
              <IconTooltip label="Add image">
                <button type="button" aria-label="Add image" className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}>
                  <ImageIcon size={16} />
                </button>
              </IconTooltip>
              <IconTooltip label="Web search">
                <button type="button" aria-label="Web search" className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}>
                  <Globe size={16} />
                </button>
              </IconTooltip>
              <IconTooltip label="Voice">
                <button type="button" aria-label="Voice" className={`rounded-full p-2 transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}>
                  <Mic size={16} />
                </button>
              </IconTooltip>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector
                models={models}
                selected={selectedModel}
                onSelect={setSelectedModel}
                theme={theme}
              />
              <IconTooltip label={isLoading ? 'Stop' : 'Send'}>
                <button
                  onClick={isLoading ? onStop : onSubmit}
                  disabled={!isLoading && !input.trim()}
                  aria-label={isLoading ? 'Stop' : 'Send'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    isLoading
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : theme === 'dark'
                        ? 'bg-white text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40'
                        : 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'
                  }`}
                >
                  {isLoading ? <Square size={15} /> : <Send size={15} />}
                </button>
              </IconTooltip>
            </div>
          </div>
        </div>
        <p className={`mt-2 text-center text-[0.8rem] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
