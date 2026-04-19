import { z } from 'zod';

export const createNodeSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1),
    parentId: z.string().min(1).nullable().optional(),
    values: z.record(z.string(), z.unknown()).default({}),
  }),
});

export const updateNodeSchema = z.object({
  body: z.object({
    parentId: z.string().min(1).nullable().optional(),
    values: z.record(z.string(), z.unknown()).optional(),
  }),
});
