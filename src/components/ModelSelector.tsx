import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Check, ChevronDown, Image, Video, Volume2 } from 'lucide-react'
import type { ThemeMode } from '../store/chatStore'
import type { ModelInfo } from '../types'

interface Props {
  models: ModelInfo[]
  selected: string
  onSelect: (id: string) => void
  theme: ThemeMode
}

/** Provider color map — bg + text classes for the badge */
const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  google: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  openai: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  anthropic: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  opencode: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  groq: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  mistral: { bg: 'bg-sky-500/20', text: 'text-sky-400' },
  cohere: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  deepseek: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  xai: { bg: 'bg-red-500/20', text: 'text-red-400' },
  openrouter: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  together: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  fireworks: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  perplexity: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  cerebras: { bg: 'bg-lime-500/20', text: 'text-lime-400' },
  sambanova: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400' },
}

function getProviderColor(providerId: string) {
  return PROVIDER_COLORS[providerId.toLowerCase()] || { bg: 'bg-zinc-500/20', text: 'text-zinc-400' }
}

export function ModelSelector({ models, selected, onSelect, theme }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const current = models.find((m) => m.id === selected) ?? {
    id: selected,
    name: selected,
    provider: '',
    providerId: '',
  }

  function getLogoUrl(providerId: string) {
    return `https://models.dev/logos/${providerId.toLowerCase()}.svg`
  }

  function renderIcon(label: string, providerId: string) {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-zinc-700">
        <img
          src={getLogoUrl(providerId)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-3.5 w-3.5"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  // Flat filtered list for keyboard navigation
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return models
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    )
  }, [models, query])

  // Grouped for display
  const grouped = useMemo(() => {
    const groups: Record<string, { providerId: string; models: ModelInfo[] }> = {}
    for (const model of filtered) {
      const providerName = model.provider.charAt(0).toUpperCase() + model.provider.slice(1)
      if (!groups[providerName]) groups[providerName] = { providerId: model.providerId, models: [] }
      groups[providerName].models.push(model)
    }
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    return sortedEntries
  }, [filtered])

  // Flat ordered list matching display order (for index-based navigation)
  const flatList = useMemo(() => {
    const list: ModelInfo[] = []
    for (const [, group] of grouped) {
      list.push(...group.models)
    }
    return list
  }, [grouped])

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  // Reset highlight when opening
  useEffect(() => {
    if (open) {
      setHighlightedIndex(0)
      setQuery('')
    }
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    const el = itemRefs.current.get(highlightedIndex)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selectModel = useCallback((id: string) => {
    onSelect(id)
    setOpen(false)
    setQuery('')
  }, [onSelect])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % flatList.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + flatList.length) % flatList.length)
        break
      case 'Enter':
        e.preventDefault()
        if (flatList[highlightedIndex]) {
          selectModel(flatList[highlightedIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Track flat index across grouped rendering
  let flatIndex = -1

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 max-w-[18rem] cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[0.8rem] transition ${theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}
      >
        {renderIcon(current.name, current.providerId || current.provider || 'google')}
        <span className="max-w-28 truncate">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open && (
        <div className={`absolute bottom-11 left-0 z-30 w-96 overflow-hidden rounded-xl border shadow-2xl ${theme === 'dark' ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
          <div className={`border-b p-2 ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'}`}>
            <div className="relative">
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models..."
                className={`h-9 w-full rounded-md border px-2 pr-8 text-xs outline-none placeholder:text-zinc-500 ${theme === 'dark' ? 'border-zinc-700 bg-zinc-800 text-zinc-100' : 'border-zinc-200 bg-zinc-50 text-zinc-900'}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition hover:text-zinc-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5" role="listbox">
            {grouped.map(([provider, group]) => {
              const color = getProviderColor(group.providerId)
              return (
                <div key={provider} className="mb-1.5">
                  <p className={`px-2 py-1 text-[11px] font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {provider}
                  </p>
                  {group.models.map((m) => {
                    flatIndex++
                    const idx = flatIndex
                    const isHighlighted = idx === highlightedIndex
                    const isSelected = m.id === selected

                    return (
                      <button
                        key={m.id}
                        ref={(el) => { if (el) itemRefs.current.set(idx, el); else itemRefs.current.delete(idx) }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectModel(m.id)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                          isHighlighted
                            ? theme === 'dark'
                              ? 'bg-zinc-800 text-white'
                              : 'bg-zinc-100 text-zinc-900'
                            : isSelected
                              ? theme === 'dark'
                                ? 'bg-zinc-800/50 text-white'
                                : 'bg-zinc-50 text-zinc-900'
                              : theme === 'dark'
                                ? 'text-zinc-200 hover:bg-zinc-800/70'
                                : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {renderIcon(m.name, m.providerId || m.provider || 'google')}
                        <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
                        {/* Modality indicators */}
                        {m.inputModalities && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            {m.inputModalities.includes('image') && (
                              <Image className="h-3 w-3 text-zinc-500" aria-label="Supports image input" />
                            )}
                            {m.inputModalities.includes('video') && (
                              <Video className="h-3 w-3 text-zinc-500" aria-label="Supports video input" />
                            )}
                            {m.inputModalities.includes('audio') && (
                              <Volume2 className="h-3 w-3 text-zinc-500" aria-label="Supports audio input" />
                            )}
                          </span>
                        )}
                        <span className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${color.bg} ${color.text}`}>
                          {m.provider}
                        </span>
                        {isSelected && <Check className="ml-1 h-4 w-4 text-emerald-400" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {flatList.length === 0 && (
              <p className={`px-2 py-4 text-center text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
