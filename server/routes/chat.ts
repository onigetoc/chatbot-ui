import { Hono } from 'hono'
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const app = new Hono()

/**
 * Resolve a model into a Vercel AI SDK model instance.
 * The baseURL comes from the frontend (sourced from models.dev JSON).
 */
function resolveModel(modelSlug: string, providerId: string, baseURL: string, apiKey: string) {
  const provider = createOpenAICompatible({
    name: providerId,
    baseURL,
    apiKey,
  })
  return provider(modelSlug)
}

/** Classify an error into a structured error code for the frontend */
function classifyError(error: unknown): { code: string; message: string; status: number } {
  if (!(error instanceof Error)) {
    return { code: 'server_error', message: String(error), status: 500 }
  }

  const msg = error.message.toLowerCase()

  // Extract response body if available
  let responseBody = ''
  if ('responseBody' in error) {
    responseBody = String((error as Record<string, unknown>).responseBody || '').toLowerCase()
  }

  const combined = `${msg} ${responseBody}`

  // Rate limit detection
  if (
    combined.includes('rate limit') ||
    combined.includes('rate_limit') ||
    combined.includes('too many requests') ||
    combined.includes('429') ||
    combined.includes('quota exceeded') ||
    combined.includes('quota_exceeded') ||
    combined.includes('resource_exhausted') ||
    combined.includes('tokens per min')
  ) {
    return { code: 'rate_limit', message: error.message, status: 429 }
  }

  // Auth / invalid key detection
  if (
    combined.includes('401') ||
    combined.includes('403') ||
    combined.includes('unauthorized') ||
    combined.includes('invalid api key') ||
    combined.includes('invalid_api_key') ||
    combined.includes('incorrect api key') ||
    combined.includes('authentication') ||
    combined.includes('permission denied') ||
    combined.includes('invalid x-api-key')
  ) {
    return { code: 'auth_error', message: error.message, status: 401 }
  }

  // Server-side errors (5xx)
  if (
    combined.includes('500') ||
    combined.includes('502') ||
    combined.includes('503') ||
    combined.includes('504') ||
    combined.includes('internal server error') ||
    combined.includes('service unavailable') ||
    combined.includes('bad gateway') ||
    combined.includes('overloaded')
  ) {
    return { code: 'server_error', message: error.message, status: 502 }
  }

  return { code: 'generic', message: error.message, status: 500 }
}

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages array is required', code: 'generic' }, 400)
  }

  const { messages, model: modelId, apiKey, baseURL } = body

  console.log('[chat] request:', { model: modelId, hasApiKey: !!apiKey, hasBaseURL: !!baseURL, messagesCount: messages.length })

  if (!apiKey) {
    return c.json({ error: 'API key is required. Configure one in Settings > API Keys.', code: 'missing_api_key' }, 400)
  }

  if (!baseURL) {
    return c.json({ error: 'Provider base URL is missing. Re-select your model in Settings.', code: 'generic' }, 400)
  }

  // Parse "provider/model-slug"
  const slashIndex = (modelId || '').indexOf('/')
  const providerId = slashIndex !== -1 ? modelId.substring(0, slashIndex) : 'opencode'
  const modelSlug = slashIndex !== -1 ? modelId.substring(slashIndex + 1) : modelId

  try {
    const model = resolveModel(modelSlug, providerId, String(baseURL), String(apiKey))
    const result = streamText({
      model,
      messages,
      maxTokens: 4096,
      onFinish: ({ finishReason, usage }) => {
        console.log('[chat] finished:', { model: modelId, finishReason, usage })
      },
    })

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        const classified = classifyError(error)
        console.error('[chat] stream error:', classified.code, classified.message)

        // Return a JSON-encoded error so the frontend can parse it
        return JSON.stringify({ code: classified.code, message: classified.message })
      },
    })
  } catch (err: unknown) {
    const classified = classifyError(err)
    console.error('[chat] error:', classified.code, classified.message)
    return c.json({ error: classified.message, code: classified.code }, classified.status as 400)
  }
})

export default app
