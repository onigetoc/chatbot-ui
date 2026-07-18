/**
 * API Keys Management UI Component — Full Frontend Mode.
 *
 * Providers are loaded from models.dev (same source as ModelsSection).
 * Keys are stored in localStorage. When the user chats, the frontend
 * sends the relevant key to the server in the request body.
 */
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Search,
  ScanSearch,
  Trash2,
  X,
} from 'lucide-react'
import { getModelsDevData, type ModelsDevProvider } from './models-cache'
import { POPULAR_PROVIDERS } from './popular-providers'

// ─── localStorage key management ─────────────────────────────────────
const KEYS_STORAGE_KEY = 'providers_api_keys'

function loadStoredKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveStoredKeys(keys: Record<string, string>): void {
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys))
  window.dispatchEvent(new CustomEvent('api-keys-changed'))
}

/** Public helper — other modules can read a provider key */
export function getStoredApiKey(provider: string): string | undefined {
  return loadStoredKeys()[provider] || undefined
}

/** Get all configured provider IDs */
export function getConfiguredProviderIds(): string[] {
  return Object.keys(loadStoredKeys()).filter((k) => !!loadStoredKeys()[k])
}

// ─── Fallback providers (in case models.dev fetch fails) ─────────────
const FALLBACK_PROVIDERS: { id: string; name: string; url?: string }[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', url: 'https://console.anthropic.com/' },
  { id: 'google', name: 'Google (Gemini)', url: 'https://aistudio.google.com/api-keys' },
  { id: 'openai', name: 'OpenAI (GPT)', url: 'https://platform.openai.com/api-keys' },
  { id: 'opencode', name: 'OpenCode (Zen)', url: 'https://opencode.ai/auth' },
  { id: 'groq', name: 'Groq', url: 'https://console.groq.com/keys' },
  { id: 'mistral', name: 'Mistral', url: 'https://console.mistral.ai/api-keys/' },
  { id: 'cohere', name: 'Cohere', url: 'https://dashboard.cohere.com/api-keys' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
  { id: 'xai', name: 'xAI (Grok)', url: 'https://console.x.ai/' },
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/keys' },
  { id: 'together', name: 'Together AI', url: 'https://api.together.xyz/settings/api-keys' },
  { id: 'fireworks', name: 'Fireworks AI', url: 'https://fireworks.ai/account/api-keys' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/settings/api' },
  { id: 'cerebras', name: 'Cerebras', url: 'https://cloud.cerebras.ai/' },
  { id: 'sambanova', name: 'SambaNova', url: 'https://cloud.sambanova.ai/' },
]

interface ProviderOption {
  id: string
  name: string
  url?: string
  isPopular: boolean
}

interface ScannedKey {
  envVar: string
  provider: string
  label: string
  masked: string
}

interface ApiKeysSectionProps {
  isDark: boolean
}

export default function ApiKeysSection({ isDark }: ApiKeysSectionProps) {
  const { t } = useTranslation()
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>(loadStoredKeys)
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Scan state
  const [scannedKeys, setScannedKeys] = useState<ScannedKey[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  // Load providers from models.dev
  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const data = await getModelsDevData()
      const options: ProviderOption[] = Object.entries(data).map(([id, p]: [string, ModelsDevProvider]) => ({
        id,
        name: p.name,
        url: p.doc,
        isPopular: POPULAR_PROVIDERS.includes(id),
      }))

      // Sort: popular first, then alphabetical
      options.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1
        if (!a.isPopular && b.isPopular) return 1
        if (a.isPopular && b.isPopular) {
          return POPULAR_PROVIDERS.indexOf(a.id) - POPULAR_PROVIDERS.indexOf(b.id)
        }
        return a.name.localeCompare(b.name)
      })

      setProviders(options)
    } catch {
      // Fallback to hardcoded list
      setProviders(FALLBACK_PROVIDERS.map(p => ({
        ...p,
        isPopular: POPULAR_PROVIDERS.includes(p.id),
      })))
    }
  }

  // Refresh when keys change from another component
  useEffect(() => {
    const handler = () => setStoredKeys(loadStoredKeys())
    window.addEventListener('api-keys-changed', handler)
    return () => window.removeEventListener('api-keys-changed', handler)
  }, [])

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(t)
    }
  }, [feedback])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [dropdownOpen])

  // Pre-fill masked key when selecting a configured provider
  useEffect(() => {
    if (selectedProvider && storedKeys[selectedProvider.id]) {
      const key = storedKeys[selectedProvider.id]
      const masked = key.length <= 10
        ? '••••••••'
        : `${key.substring(0, 4)}${'•'.repeat(20)}${key.slice(-4)}`
      setKeyInput(masked)
      setShowKey(false)
    } else {
      setKeyInput('')
    }
  }, [selectedProvider])

  const configuredProviders = providers.filter((p) => !!storedKeys[p.id])

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  )

  // Group filtered providers
  const popularFiltered = filteredProviders.filter(p => p.isPopular)
  const othersFiltered = filteredProviders.filter(p => !p.isPopular)

  const handleSelectProvider = (provider: ProviderOption) => {
    setSelectedProvider(provider)
    setDropdownOpen(false)
    setSearch('')
  }

  const isMaskedValue = (value: string) => value.includes('••••')

  const handleSave = () => {
    if (!selectedProvider || !keyInput.trim()) return
    // Don't save if it's the masked placeholder
    if (isMaskedValue(keyInput)) {
      setFeedback({ type: 'error', msg: t('keysSection.enterNewKey') })
      return
    }

    const next = { ...storedKeys, [selectedProvider.id]: keyInput.trim() }
    saveStoredKeys(next)
    setStoredKeys(next)

    setFeedback({ type: 'success', msg: t('keysSection.keySaved', { name: selectedProvider.name }) })
    setKeyInput('')
    setSelectedProvider(null)
    setShowKey(false)
  }

  const handleRemove = (providerId: string) => {
    const next = { ...storedKeys }
    delete next[providerId]
    saveStoredKeys(next)
    setStoredKeys(next)

    const label = providers.find((p) => p.id === providerId)?.name || providerId
    setFeedback({ type: 'success', msg: t('keysSection.keyRemoved', { name: label }) })

    // Clear input if we're removing the currently selected provider
    if (selectedProvider?.id === providerId) {
      setSelectedProvider(null)
      setKeyInput('')
    }
  }

  // ─── Scan env keys ─────────────────────────────────────────────────
  const handleScan = async () => {
    setScanning(true)
    setScanError(null)
    try {
      const res = await fetch('/api/keys/scan')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setScannedKeys(data.keys || [])
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to scan')
      setScannedKeys(null)
    } finally {
      setScanning(false)
    }
  }

  const handleAddScannedKey = async (envVar: string) => {
    try {
      const res = await fetch('/api/keys/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()

      if (data.success && data.key) {
        const next = { ...storedKeys, [data.provider]: data.key }
        saveStoredKeys(next)
        setStoredKeys(next)
        setFeedback({ type: 'success', msg: t('keysSection.keyAdded', { name: data.label, envVar }) })
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed to add key' })
    }
  }

  return (
    <div>
      <h1 className={`text-xl font-semibold mb-1 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{t('keysSection.title')}</h1>
      <p className={`text-sm mb-6 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        {t('keysSection.subtitle')}
      </p>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
          feedback.type === 'success'
            ? isDark ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-700/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isDark ? 'bg-rose-500/10 text-rose-300 border border-rose-700/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Add / Update API Key */}
      <div className={`rounded-xl border p-4 mb-6 ${isDark ? 'border-zinc-800 bg-zinc-800/60' : 'border-zinc-300 bg-zinc-200'}`}>
        <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{t('keysSection.addUpdate')}</h3>
        <div className="flex flex-col gap-3">
          {/* Provider searchable dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition ${
                isDark
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-zinc-400'
              }`}
            >
              <span className={selectedProvider ? '' : (isDark ? 'text-zinc-500' : 'text-zinc-400')}>
                {selectedProvider ? (
                  <span className="flex items-center gap-2">
                    {selectedProvider.name}
                    {selectedProvider.isPopular && (
                      <span className={`rounded px-1.5 py-0.5 text-xs ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>{t('modelsSection.popular')}</span>
                    )}
                    {storedKeys[selectedProvider.id] && (
                      <span className={`rounded px-1.5 py-0.5 text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{t('keysSection.configured')}</span>
                    )}
                  </span>
                ) : t('keysSection.selectProvider')}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className={`absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border shadow-lg ${
                isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-300 bg-white'
              }`}>
                {/* Search input */}
                <div className={`border-b p-2 ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
                  <div className="relative">
                    <Search className={`absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('keysSection.searchProviders')}
                      className={`w-full rounded-md border-none py-2 pl-8 pr-3 text-sm outline-none ${
                        isDark ? 'bg-zinc-900 text-zinc-200 placeholder:text-zinc-500' : 'bg-zinc-50 text-zinc-800 placeholder:text-zinc-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Provider list */}
                <div className="max-h-64 overflow-y-auto p-1">
                  {/* Popular section */}
                  {popularFiltered.length > 0 && (
                    <>
                      <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {t('modelsSection.popular')}
                      </div>
                      {popularFiltered.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => handleSelectProvider(provider)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-left transition ${
                            isDark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-zinc-800 hover:bg-zinc-100'
                          }`}
                        >
                          <span>{provider.name}</span>
                          <div className="flex items-center gap-2">
                            {storedKeys[provider.id] && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Others section */}
                  {othersFiltered.length > 0 && (
                    <>
                      {popularFiltered.length > 0 && (
                        <div className={`mx-2 my-1 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`} />
                      )}
                      <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {t('keysSection.allProviders')}
                      </div>
                      {othersFiltered.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => handleSelectProvider(provider)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-left transition ${
                            isDark ? 'text-zinc-200 hover:bg-zinc-700' : 'text-zinc-800 hover:bg-zinc-100'
                          }`}
                        >
                          <span>{provider.name}</span>
                          <div className="flex items-center gap-2">
                            {storedKeys[provider.id] && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {filteredProviders.length === 0 && (
                    <p className={`px-3 py-4 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {t('keysSection.noProvidersFound')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Key input + save */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1 flex flex-col gap-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onFocus={() => {
                    // Clear the masked placeholder when user focuses to type a new key
                    if (isMaskedValue(keyInput)) {
                      setKeyInput('')
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                  placeholder={selectedProvider ? t('keysSection.pasteKey') : t('keysSection.selectFirst')}
                  disabled={!selectedProvider}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm font-mono ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 disabled:opacity-40' : 'border-zinc-300 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 disabled:opacity-40'}`}
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {selectedProvider?.url && (
                <div className="flex flex-col gap-1">
                  <a href={selectedProvider.url} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                    <ExternalLink className="h-3 w-3" />
                    {t('keysSection.getApiKey')}
                  </a>
                  {selectedProvider.id === 'google' && (
                    <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-800'}`}>
                      <ExternalLink className="h-3 w-3" />
                      {t('keysSection.googleAiStudioFree')}
                    </a>
                  )}
                </div>
              )}
            </div>

            <button type="button" onClick={handleSave} disabled={!selectedProvider || !keyInput.trim() || isMaskedValue(keyInput)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition shrink-0 ${
                !selectedProvider || !keyInput.trim() || isMaskedValue(keyInput)
                  ? 'cursor-not-allowed ' + (isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400')
                  : isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}>
              <Plus className="inline h-4 w-4 mr-1" />
              {t('keysSection.saveKey')}
            </button>
          </div>
        </div>
      </div>

      {/* Configured providers */}
      {configuredProviders.length > 0 && (
        <div className={`rounded-xl border mb-6 ${isDark ? 'border-zinc-800 bg-zinc-800/60' : 'border-zinc-300 bg-zinc-200'}`}>
          <h3 className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {t('keysSection.configuredProviders', { count: configuredProviders.length })}
          </h3>
          {configuredProviders.map((p) => (
            <div key={p.id} className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50'}`}>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{p.name}</span>
                <span className={`text-xs font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {storedKeys[p.id].substring(0, 8)}...
                </span>
              </div>
              <button type="button" onClick={() => handleRemove(p.id)}
                className={`rounded-md p-1.5 transition ${isDark ? 'text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-zinc-400 hover:bg-rose-50 hover:text-rose-500'}`}
                aria-label={`Remove ${p.name} key`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {configuredProviders.length === 0 && (
        <div className={`rounded-xl border p-6 text-center mb-6 ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-400'}`}>
          <p className="text-sm">{t('keysSection.noKeysYet')}</p>
          <p className="text-xs mt-1">{t('keysSection.noKeysHint')}</p>
        </div>
      )}

      {/* Scan System Environment Variables */}
      <div className={`rounded-xl border p-4 ${isDark ? 'border-zinc-800 bg-zinc-800/60' : 'border-zinc-300 bg-zinc-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{t('keysSection.detectKeys')}</h3>
          <button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'
                : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'
            }`}
          >
            <ScanSearch className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {t('keysSection.scanButton')}
          </button>
        </div>
        <p className={`text-xs mb-3 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {t('keysSection.scanDescription')}
        </p>

        {/* Scan error */}
        {scanError && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${isDark ? 'border-rose-900 bg-rose-950/50 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {scanError}
          </div>
        )}

        {/* Scan results */}
        {scannedKeys !== null && (
          <div className={`rounded-lg border ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}>
            {scannedKeys.length === 0 ? (
              <p className={`px-4 py-4 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {t('keysSection.noKeysFound')}
              </p>
            ) : (
              scannedKeys.map((key, idx) => {
                const alreadyConfigured = !!storedKeys[key.provider]
                return (
                  <div
                    key={key.envVar}
                    className={`flex items-center justify-between px-4 py-3 ${
                      idx !== scannedKeys.length - 1 ? (isDark ? 'border-b border-zinc-700' : 'border-b border-zinc-300') : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {key.label}
                        </span>
                        {alreadyConfigured && (
                          <span className={`rounded px-1.5 py-0.5 text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                            {t('keysSection.configured').toLowerCase()}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {key.envVar} = {key.masked}
                      </span>
                    </div>
                    {!alreadyConfigured && (
                      <button
                        type="button"
                        onClick={() => handleAddScannedKey(key.envVar)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('keysSection.addToChatbot')}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
