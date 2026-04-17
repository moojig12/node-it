import express from 'express'
import { prisma } from '../lib/prisma'

const router = express.Router()

// GET /categories — list all categories with their fields
router.get('/', async (_req, res) => {
  try {
    const data = await prisma.category.findMany({ include: { fields: true } })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// GET /categories/:id — get a single category with fields and nodes
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { fields: true, nodes: { include: { values: true } } }
    })
    if (!category) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' })
  }
})

// POST /categories — create a new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body as { name: string }
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const category = await prisma.category.create({ data: { name } })
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// DELETE /categories/:id — delete a category
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id }
    })
    if (!existing) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    await prisma.category.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
