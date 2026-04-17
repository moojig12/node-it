import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createCategorySchema, createNodeSchema } from '../lib/validators.js'

const router = Router()

type TreeNode = {
  id: string
  parentId: string | null
  collapsed: boolean
  createdAt: Date
  values: Array<{ fieldId: string; value: unknown }>
  children: TreeNode[]
}

const buildTree = (
  flatNodes: Array<{
    id: string
    parentId: string | null
    collapsed: boolean
    createdAt: Date
    values: Array<{ fieldId: string; value: unknown }>
  }>
): TreeNode[] => {
  const map = new Map<string, TreeNode>()

  for (const node of flatNodes) {
    map.set(node.id, { ...node, children: [] })
  }

  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (!node.parentId) {
      roots.push(node)
      continue
    }
    const parent = map.get(node.parentId)
    if (!parent) {
      roots.push(node)
      continue
    }
    parent.children.push(node)
  }

  const sortByCreated = (items: TreeNode[]) => {
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    for (const item of items) sortByCreated(item.children)
  }

  sortByCreated(roots)
  return roots
}

router.get('/', async (_req, res) => {
  const data = await prisma.category.findMany({
    include: {
      fields: true,
      _count: {
        select: { nodes: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  res.json(data)
})

router.post('/', async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid category payload', issues: parsed.error.flatten() })
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      fields: {
        create: parsed.data.fields
      }
    },
    include: { fields: true }
  })

  return res.status(201).json(category)
})

router.get('/:id/tree', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      fields: true,
      nodes: {
        include: {
          values: {
            select: { fieldId: true, value: true }
          }
        }
      }
    }
  })

  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  const tree = buildTree(
    category.nodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      collapsed: node.collapsed,
      createdAt: node.createdAt,
      values: node.values
    }))
  )

  return res.json({
    id: category.id,
    name: category.name,
    fields: category.fields,
    tree
  })
})

router.post('/:id/nodes', async (req, res) => {
  const parsed = createNodeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid node payload', issues: parsed.error.flatten() })
  }

  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { fields: true }
  })

  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }

  const fieldMap = new Map(category.fields.map((f) => [f.id, f]))

  for (const fv of parsed.data.values) {
    if (!fieldMap.has(fv.fieldId)) {
      return res.status(400).json({ error: `Field ${fv.fieldId} does not belong to category` })
    }
  }

  for (const field of category.fields.filter((f) => f.required)) {
    const found = parsed.data.values.find((v) => v.fieldId === field.id)
    if (!found || found.value === '' || found.value === null) {
      return res.status(400).json({ error: `Missing required field: ${field.name}` })
    }
  }

  if (parsed.data.parentId) {
    const parent = await prisma.node.findFirst({
      where: { id: parsed.data.parentId, categoryId: req.params.id }
    })
    if (!parent) {
      return res.status(400).json({ error: 'Parent node does not exist in this category' })
    }
  }

  const node = await prisma.node.create({
    data: {
      categoryId: req.params.id,
      parentId: parsed.data.parentId ?? null,
      values: {
        createMany: {
          data: parsed.data.values.map((value) => ({
            fieldId: value.fieldId,
            value: value.value === null ? Prisma.JsonNull : (value.value as Prisma.InputJsonValue)
          }))
        }
      }
    },
    include: {
      values: true
    }
  })

  return res.status(201).json(node)
})

export default router
