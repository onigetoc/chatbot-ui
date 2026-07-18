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

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages array is required' }, 400)
  }

  const { messages, model: modelId, apiKey, baseURL } = body

  console.log('[chat] request:', { model: modelId, hasApiKey: !!apiKey, hasBaseURL: !!baseURL, messagesCount: messages.length })

  if (!apiKey) {
    return c.json({ error: 'API key is required. Configure one in Settings > API Keys.' }, 400)
  }

  if (!baseURL) {
    return c.json({ error: 'Provider base URL is missing. Re-select your model in Settings.' }, 400)
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

    // Consume the stream to detect errors before returning
    // Use getErrorMessage to forward real API errors to client
    return result.toDataStreamResponse({
      getErrorMessage: (error: unknown) => {
        if (error instanceof Error) {
          console.error('[chat] stream error:', error.message)
          // Try to extract the actual API error
          if ('responseBody' in error) {
            const respBody = (error as any).responseBody
            console.error('[chat] response body:', respBody)
            return String(respBody || error.message)
          }
          if ('cause' in error && error.cause) {
            console.error('[chat] cause:', error.cause)
          }
          return error.message
        }
        console.error('[chat] stream error (unknown):', error)
        return String(error)
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[chat] error:', message)
    if (err instanceof Error && 'cause' in err) {
      console.error('[chat] cause:', err.cause)
    }
    return c.json({ error: message }, 500)
  }
})

export default app
