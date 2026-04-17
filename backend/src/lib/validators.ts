import { z } from 'zod'

export const fieldTypeValues = ['text', 'number', 'currency', 'boolean', 'date'] as const

export const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  fields: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        type: z.enum(fieldTypeValues),
        required: z.boolean().optional().default(false)
      })
    )
    .min(1)
})

export const createNodeSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  values: z.array(
    z.object({
      fieldId: z.string().uuid(),
      value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.any()), z.array(z.any())])
    })
  )
})

export const patchCollapseSchema = z.object({
  collapsed: z.boolean()
})
