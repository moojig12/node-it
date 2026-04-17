import express from 'express'
import { prisma } from '../lib/prisma'

const router = express.Router()

// GET /nodes — list all nodes
router.get('/', async (_req, res) => {
  try {
    const nodes = await prisma.node.findMany({ include: { values: true } })
    res.json(nodes)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nodes' })
  }
})

// GET /nodes/:id — get a single node
router.get('/:id', async (req, res) => {
  try {
    const node = await prisma.node.findUnique({
      where: { id: req.params.id },
      include: { values: true }
    })
    if (!node) {
      res.status(404).json({ error: 'Node not found' })
      return
    }
    res.json(node)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch node' })
  }
})

// POST /nodes — create a new node
router.post('/', async (req, res) => {
  try {
    const { categoryId, parentId, collapsed } = req.body as {
      categoryId: string
      parentId?: string
      collapsed?: boolean
    }
    if (!categoryId) {
      res.status(400).json({ error: 'categoryId is required' })
      return
    }
    const node = await prisma.node.create({
      data: { categoryId, parentId, collapsed: collapsed ?? false }
    })
    res.status(201).json(node)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create node' })
  }
})

// PATCH /nodes/:id — update a node (e.g. toggle collapsed)
router.patch('/:id', async (req, res) => {
  try {
    const { collapsed, parentId } = req.body as {
      collapsed?: boolean
      parentId?: string
    }
    const node = await prisma.node.update({
      where: { id: req.params.id },
      data: { collapsed, parentId }
    })
    res.json(node)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update node' })
  }
})

// DELETE /nodes/:id — delete a node
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.node.findUnique({
      where: { id: req.params.id }
    })
    if (!existing) {
      res.status(404).json({ error: 'Node not found' })
      return
    }
    await prisma.node.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete node' })
  }
})

export default router
