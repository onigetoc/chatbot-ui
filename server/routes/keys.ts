import { Hono } from 'hono'
import { PROVIDERS, getEnvToProviderMap } from '../../src/providers/registry'

const app = new Hono()

/**
 * GET /api/keys/scan
 * Scans system environment variables for known LLM provider API keys.
 * Returns masked values (never exposes full keys to the frontend).
 */
app.get('/scan', (c) => {
  const envMap = getEnvToProviderMap()
  const results: Array<{
    envVar: string
    provider: string
    label: string
    masked: string
  }> = []

  for (const [envVar, providerId] of Object.entries(envMap)) {
    const value = process.env[envVar]
    if (value && value.trim()) {
      const masked =
        value.length <= 10
          ? '***'
          : `${value.substring(0, 6)}...${value.slice(-4)}`
      results.push({
        envVar,
        provider: providerId,
        label: PROVIDERS[providerId]?.label || providerId,
        masked,
      })
    }
  }

  return c.json({ keys: results })
})

/**
 * POST /api/keys/scan/add
 * Import a scanned env key — returns the full key value so the frontend
 * can store it in localStorage (same pattern as manual entry).
 */
app.post('/add', async (c) => {
  const body = await c.req.json().catch(() => null)
  const envVar = (body?.envVar as string || '').trim()

  if (!envVar) {
    return c.json({ error: 'envVar is required' }, 400)
  }

  const envMap = getEnvToProviderMap()
  const provider = envMap[envVar]

  if (!provider) {
    return c.json({ error: 'Unknown environment variable' }, 400)
  }

  const value = process.env[envVar]
  if (!value) {
    return c.json({ error: `${envVar} not found in system environment` }, 404)
  }

  return c.json({
    success: true,
    provider,
    label: PROVIDERS[provider]?.label || provider,
    key: value.trim(),
  })
})

export default app
