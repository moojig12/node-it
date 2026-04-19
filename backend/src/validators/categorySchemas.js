import { z } from 'zod';

const fieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'currency', 'date', 'boolean']),
  aggregate: z.enum(['sum', 'avg', 'count']).nullable().optional(),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    fields: z.array(fieldSchema).default([]),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    fields: z.array(fieldSchema).optional(),
  }),
});
