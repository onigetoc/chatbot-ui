import { useRef, useEffect, useState, useCallback } from 'react'
import type { KeyboardEvent, DragEvent } from 'react'
import { Send, Square, Paperclip, Image as ImageIcon, X } from 'lucide-react'
import { ModelSelector } from './ModelSelector'
import { IconTooltip } from './IconTooltip'
import { useModels } from '../hooks/useModels'
import { useChatStore, type ThemeMode } from '../store/chatStore'

export interface FileAttachment {
  name: string
  contentType: string
  url: string // data URL (base64)
}

interface Props {
  input: string
  setInput: (v: string) => void
  onSubmit: (attachments?: FileAttachment[]) => void
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

/** Convert a File to a base64 data URL */
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ComposerBar({ input, setInput, onSubmit, isLoading, onStop, theme }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { models } = useModels()
  const { selectedModel, setSelectedModel } = useChatStore()
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useRefocusOnLoad(textareaRef, isLoading)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [input])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newAttachments: FileAttachment[] = []
    for (const file of Array.from(files)) {
      // Limit to 10MB
      if (file.size > 10 * 1024 * 1024) continue
      const url = await fileToDataURL(file)
      newAttachments.push({
        name: file.name,
        contentType: file.type,
        url,
      })
    }
    setAttachments((prev) => [...prev, ...newAttachments])
  }, [])

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && (input.trim() || attachments.length > 0)) handleSend()
    }
  }

  function handleSend() {
    if (!input.trim() && attachments.length === 0) return
    onSubmit(attachments.length > 0 ? attachments : undefined)
    setAttachments([])
  }

  // Drag and drop handlers
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files)
    }
  }

  // Paste handler for images
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        await addFiles(files)
      }
    }

    el.addEventListener('paste', handlePaste)
    return () => el.removeEventListener('paste', handlePaste)
  }, [addFiles])

  const isDark = theme === 'dark'

  return (
    <div
      className={`${isDark ? 'bg-zinc-950' : 'bg-zinc-100'} px-4 pb-4 pt-3`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-4xl">
        <div className={`flex flex-col gap-3 rounded-3xl px-4 py-4 transition-colors ${
          isDragging
            ? isDark
              ? 'bg-blue-500/10 ring-2 ring-blue-500/50'
              : 'bg-blue-50 ring-2 ring-blue-300'
            : isDark
              ? 'bg-zinc-900/40'
              : 'bg-white shadow-sm ring-1 ring-zinc-200'
        }`}>
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                    isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  {att.contentType.startsWith('image/') ? (
                    <img src={att.url} alt={att.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className={`ml-1 rounded-full p-0.5 transition ${isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'}`}
                    aria-label={`Remove ${att.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDragging ? 'Drop files here...' : 'Message… (Enter to send, Shift+Enter for new line)'}
            rows={1}
            disabled={isLoading}
            className={`min-h-[52px] max-h-[220px] resize-none bg-transparent text-[1rem] leading-7 outline-none placeholder:text-zinc-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}
          />
          <div className="flex items-center justify-between gap-3">
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => { if (e.target.files) { await addFiles(e.target.files); e.target.value = '' } }}
              />
              {/* Image input (hidden) */}
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={async (e) => { if (e.target.files) { await addFiles(e.target.files); e.target.value = '' } }}
              />

              <IconTooltip label="Add files">
                <button
                  type="button"
                  aria-label="Add files"
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-full p-2 transition-colors ${isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}
                >
                  <Paperclip size={16} />
                </button>
              </IconTooltip>
              <IconTooltip label="Add image">
                <button
                  type="button"
                  aria-label="Add image"
                  onClick={() => imageInputRef.current?.click()}
                  className={`rounded-full p-2 transition-colors ${isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-200 hover:text-zinc-900'}`}
                >
                  <ImageIcon size={16} />
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
                  onClick={isLoading ? onStop : handleSend}
                  disabled={!isLoading && !input.trim() && attachments.length === 0}
                  aria-label={isLoading ? 'Stop' : 'Send'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    isLoading
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : isDark
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
        <p className={`mt-2 text-center text-[0.8rem] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
