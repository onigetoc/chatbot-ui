import { Hono } from 'hono'

const app = new Hono()

const MODELS_DEV_URL = 'https://models.dev/api.json'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

let cache: { data: unknown; ts: number } | null = null

export interface ModelInfo {
  id: string
  name: string
  provider: string
  providerId: string
}

// Always present, even if models.dev is down
const GUARANTEED: ModelInfo[] = [
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'Google', providerId: 'google' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'Google', providerId: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', providerId: 'google' },
]

function parseModelsDevData(raw: unknown): ModelInfo[] {
  const result: ModelInfo[] = []
  const seen = new Set(GUARANTEED.map((m) => m.id))

  if (raw && typeof raw === 'object') {
    for (const [providerId, providerData] of Object.entries(raw as Record<string, unknown>)) {
      const pd = providerData as Record<string, unknown>
      const providerName = (pd.name as string) || providerId
      const models = pd.models as Record<string, unknown> | undefined

      if (models && typeof models === 'object') {
        for (const [modelId, modelData] of Object.entries(models)) {
          const md = modelData as Record<string, unknown>
          const fullId = `${providerId}/${modelId}`
          if (!seen.has(fullId)) {
            seen.add(fullId)
            result.push({
              id: fullId,
              name: (md.name as string) || modelId,
              provider: providerName,
              providerId,
            })
          }
        }
      }
    }
  }

  return result
}

app.get('/', async (c) => {
  const now = Date.now()

  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return c.json([...GUARANTEED, ...parseModelsDevData(cache.data)])
  }

  try {
    const res = await fetch(MODELS_DEV_URL, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`models.dev returned ${res.status}`)
    const data = await res.json()
    cache = { data, ts: now }
    return c.json([...GUARANTEED, ...parseModelsDevData(data)])
  } catch (err) {
    console.warn('[models] models.dev unavailable, using fallback:', (err as Error).message)
    const fallback = await import('../models-fallback.json', { with: { type: 'json' } })
    return c.json([...GUARANTEED, ...(fallback.default as ModelInfo[])])
  }
})

export default app
