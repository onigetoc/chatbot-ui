import { Hono } from 'hono'
import { cors } from 'hono/cors'
import chatRoute from './routes/chat'
import modelsRoute from './routes/models'
import keysRoute from './routes/keys'

const app = new Hono()

const origin = process.env.CORS_ORIGIN || 'http://localhost:3000'
app.use('*', cors({ origin }))

app.route('/api/chat', chatRoute)
app.route('/api/models', modelsRoute)
app.route('/api/keys', keysRoute)

app.get('/health', (c) => c.json({ ok: true }))

const port = Number(process.env.SERVER_PORT) || 3001
console.log(`[server] running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
