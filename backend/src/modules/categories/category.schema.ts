import { z } from "zod";

// Schema for validating category ID parameter
export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Schema for validating category creation and update requests
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
});

// Schema for validating category update requests
export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
});