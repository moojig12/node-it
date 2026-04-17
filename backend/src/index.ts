import express from 'express'
import cors from 'cors'
import categories from './routes/categories'
import nodes from './routes/nodes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/categories', categories)
app.use('/nodes', nodes)

const PORT = process.env.PORT ?? 4000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))

export default app
