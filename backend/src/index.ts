import cors from 'cors'
import express from 'express'
import categories from './routes/categories.js'
import nodes from './routes/nodes.js'

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((v) => v.trim()) ?? '*'
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
