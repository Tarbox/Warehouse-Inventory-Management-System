import { z } from "zod";

export const listMaterialsQuerySchema = z.object({
  // Optional search string used to search materials by name.
  // trim() removes leading/trailing whitespace.
  search: z
    .string()
    .trim()
    .min(1)
    .optional(),

  // Convert the query parameter from a string to a number.
  // The resulting number must be an integer greater than zero.
  categoryId: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  // HTTP query parameters arrive as strings.
  // Convert "true" / "false" into actual boolean values.
  lowStock: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  // Convert page to a number.
  // If the client does not provide it, page 1 is used.
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  // Convert limit to a number.
  // Default is 20 and the maximum allowed value is 100.
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export const materialIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMaterialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(200),

  description: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),

  unit: z.enum([
    "PCS",
    "BOX",
    "ROLL",
    "PACK",
    "PAIR",
    "OTHER",
  ]),

  minimumQuantity: z
    .number()
    .int()
    .min(0)
    .max(1000000),

  categoryId: z
    .number()
    .int()
    .positive(),

  initialQuantity: z
    .number()
    .int()
    .min(0)
    .max(1000000)
    .default(0),
});

export const updateMaterialSchema =
  createMaterialSchema
    .omit({
      initialQuantity: true,
    })
    .partial();
// Generate the TypeScript type directly from the Zod schema.
export type ListMaterialsQuery = z.infer<
  typeof listMaterialsQuerySchema
>;