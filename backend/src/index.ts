import cors from 'cors'
import express from 'express'
import categories from './routes/categories.js'
import nodes from './routes/nodes.js'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('CORS origin denied'))
    }
  })
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/categories', categories)
app.use('/nodes', nodes)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const port = Number(process.env.PORT || 4000)
app.listen(port, () => {
  console.log(`Backend running on ${port}`)
})
