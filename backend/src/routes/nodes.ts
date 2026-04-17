import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { patchCollapseSchema } from '../lib/validators.js'

const router = Router()

router.patch('/:id/collapse', async (req, res) => {
  const parsed = patchCollapseSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() })
  }

  const existing = await prisma.node.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    return res.status(404).json({ error: 'Node not found' })
  }

  const updated = await prisma.node.update({
    where: { id: req.params.id },
    data: { collapsed: parsed.data.collapsed }
  })

  return res.json(updated)
})

router.get('/:id', async (req, res) => {
  const node = await prisma.node.findUnique({
    where: { id: req.params.id },
    include: {
      values: {
        include: {
          field: true
        }
      },
      children: {
        include: {
          values: {
            include: { field: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!node) {
    return res.status(404).json({ error: 'Node not found' })
  }

  return res.json(node)
})

export default router
