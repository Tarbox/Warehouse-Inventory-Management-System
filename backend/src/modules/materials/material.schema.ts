import { z } from "zod";

export const listMaterialsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .optional(),

  categoryId: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  lowStock: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export type ListMaterialsQuery = z.infer<
  typeof listMaterialsQuerySchema
>;