import { Hono } from 'hono'
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const app = new Hono()

/**
 * Provider base URLs — all accessed via OpenAI-compatible protocol.
 * Works with any provider that exposes an OpenAI-compatible /chat/completions endpoint.
 */
const PROVIDER_BASE_URLS: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openai: 'https://api.openai.com/v1',
  opencode: 'https://opencode.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
  cohere: 'https://api.cohere.ai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  xai: 'https://api.x.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
  perplexity: 'https://api.perplexity.ai',
  cerebras: 'https://api.cerebras.ai/v1',
  sambanova: 'https://api.sambanova.ai/v1',
}

/**
 * Resolve a model ID like "opencode/claude-sonnet-5" into a Vercel AI SDK model.
 * Uses @ai-sdk/openai-compatible so any provider works with one package.
 */
function resolveModel(modelId: string, apiKey: string) {
  // Split "provider/model-slug"
  const slashIndex = modelId.indexOf('/')
  let providerId: string
  let modelSlug: string

  if (slashIndex !== -1) {
    providerId = modelId.substring(0, slashIndex)
    modelSlug = modelId.substring(slashIndex + 1)
  } else {
    // Fallback: try to guess provider, default to opencode
    providerId = 'opencode'
    modelSlug = modelId
  }

  const baseURL = PROVIDER_BASE_URLS[providerId]
  if (!baseURL) {
    throw new Error(`Unknown provider: "${providerId}". Available: ${Object.keys(PROVIDER_BASE_URLS).join(', ')}`)
  }

  const provider = createOpenAICompatible({
    name: providerId,
    baseURL,
    apiKey,
  })

  return provider(modelSlug)
}

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages array is required' }, 400)
  }

  const { messages, model: modelId = 'opencode/gemini-2.0-flash-lite', apiKey } = body

  console.log('[chat] request:', { model: modelId, hasApiKey: !!apiKey, messagesCount: messages.length })

  if (!apiKey) {
    return c.json({ error: 'API key is required. Configure one in Settings > API Keys.' }, 400)
  }

  try {
    const model = resolveModel(String(modelId), String(apiKey))
    const result = streamText({ model, messages, maxTokens: 4096 })
    return result.toDataStreamResponse()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[chat] error:', message)
    return c.json({ error: message }, 500)
  }
})

export default app
