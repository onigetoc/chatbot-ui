/**
 * API Keys Management UI Component — Full Frontend Mode.
 *
 * Keys are stored in localStorage. When the user chats, the frontend
 * sends the relevant key to the server in the request body.
 * No backend key-management API needed.
 */
import { useState, useEffect } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

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

// ─── Provider list ───────────────────────────────────────────────────
const PROVIDERS = [
  { provider: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/' },
  { provider: 'google', label: 'Google (Gemini)', placeholder: 'AIza...', url: 'https://aistudio.google.com/app/apikey' },
  { provider: 'openai', label: 'OpenAI (GPT)', placeholder: 'sk-...', url: 'https://platform.openai.com/api-keys' },
  { provider: 'opencode', label: 'OpenCode (Zen)', placeholder: '', url: 'https://opencode.ai/auth' },
  { provider: 'groq', label: 'Groq', placeholder: 'gsk_...', url: 'https://console.groq.com/keys' },
  { provider: 'mistral', label: 'Mistral', placeholder: '', url: 'https://console.mistral.ai/api-keys/' },
  { provider: 'cohere', label: 'Cohere', placeholder: '', url: 'https://dashboard.cohere.com/api-keys' },
  { provider: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...', url: 'https://platform.deepseek.com/api_keys' },
  { provider: 'xai', label: 'xAI (Grok)', placeholder: 'xai-...', url: 'https://console.x.ai/' },
  { provider: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...', url: 'https://openrouter.ai/keys' },
  { provider: 'together', label: 'Together AI', placeholder: '', url: 'https://api.together.xyz/settings/api-keys' },
  { provider: 'fireworks', label: 'Fireworks AI', placeholder: '', url: 'https://fireworks.ai/account/api-keys' },
  { provider: 'perplexity', label: 'Perplexity', placeholder: 'pplx-...', url: 'https://www.perplexity.ai/settings/api' },
  { provider: 'cerebras', label: 'Cerebras', placeholder: '', url: 'https://cloud.cerebras.ai/' },
  { provider: 'sambanova', label: 'SambaNova', placeholder: '', url: 'https://cloud.sambanova.ai/' },
]

interface ApiKeysSectionProps {
  isDark: boolean
}

export default function ApiKeysSection({ isDark }: ApiKeysSectionProps) {
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>(loadStoredKeys)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

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

  const configuredProviders = PROVIDERS.filter((p) => !!storedKeys[p.provider])

  const handleSave = () => {
    if (!selectedProvider || !keyInput.trim()) return

    const next = { ...storedKeys, [selectedProvider]: keyInput.trim() }
    saveStoredKeys(next)
    setStoredKeys(next)

    const label = PROVIDERS.find((p) => p.provider === selectedProvider)?.label || selectedProvider
    setFeedback({ type: 'success', msg: `${label} key saved` })
    setKeyInput('')
    setSelectedProvider('')
    setShowKey(false)
  }

  const handleRemove = (provider: string) => {
    const next = { ...storedKeys }
    delete next[provider]
    saveStoredKeys(next)
    setStoredKeys(next)

    const label = PROVIDERS.find((p) => p.provider === provider)?.label || provider
    setFeedback({ type: 'success', msg: `${label} key removed` })
  }

  const selectedPlaceholder = PROVIDERS.find((p) => p.provider === selectedProvider)?.placeholder || 'Paste your API key...'

  return (
    <div>
      <h1 className={`text-xl font-semibold mb-1 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>API Keys</h1>
      <p className={`text-sm mb-6 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Manage your LLM provider API keys. Keys are stored locally in your browser.
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
        <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Add / Update API Key</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className={`w-full sm:w-44 rounded-lg border px-3 py-2 text-sm shrink-0 ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-200' : 'border-zinc-300 bg-zinc-50 text-zinc-800'}`}
          >
            <option value="">Select a provider...</option>
            {PROVIDERS.map((p) => (
              <option key={p.provider} value={p.provider}>
                {p.label} {storedKeys[p.provider] ? '✓' : ''}
              </option>
            ))}
          </select>

          <div className="flex-1 flex flex-col gap-2">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                placeholder={selectedProvider ? selectedPlaceholder : 'Select a provider first'}
                disabled={!selectedProvider}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm font-mono ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 disabled:opacity-40' : 'border-zinc-300 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 disabled:opacity-40'}`}
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {selectedProvider && (
              <a href={PROVIDERS.find((p) => p.provider === selectedProvider)?.url} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                <ExternalLink className="h-3 w-3" />
                Get an API key
              </a>
            )}
          </div>

          <button type="button" onClick={handleSave} disabled={!selectedProvider || !keyInput.trim()}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition shrink-0 ${
              !selectedProvider || !keyInput.trim()
                ? 'cursor-not-allowed ' + (isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400')
                : isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}>
            <Plus className="inline h-4 w-4 mr-1" />
            Save Key
          </button>
        </div>
      </div>

      {/* Configured providers */}
      {configuredProviders.length > 0 && (
        <div className={`rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-800/60' : 'border-zinc-300 bg-zinc-200'}`}>
          <h3 className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Configured Providers ({configuredProviders.length})
          </h3>
          {configuredProviders.map((p) => (
            <div key={p.provider} className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50'}`}>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{p.label}</span>
                <span className={`text-xs font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {storedKeys[p.provider].substring(0, 8)}...
                </span>
              </div>
              <button type="button" onClick={() => handleRemove(p.provider)}
                className={`rounded-md p-1.5 transition ${isDark ? 'text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-zinc-400 hover:bg-rose-50 hover:text-rose-500'}`}
                aria-label={`Remove ${p.label} key`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {configuredProviders.length === 0 && (
        <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-400'}`}>
          <p className="text-sm">No API keys configured yet.</p>
          <p className="text-xs mt-1">Add a provider key above to start chatting.</p>
        </div>
      )}
    </div>
  )
}
