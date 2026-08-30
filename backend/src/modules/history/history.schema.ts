import { z } from "zod";

export const historyQuerySchema = z.object({
  userId: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),

  materialId: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),

  operation: z
    .enum([
      "INCREMENT",
      "DECREMENT",
      "SET",
    ])
    .optional(),

  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(50),
});
// Define a TypeScript type for the history query parameters based on the Zod schema.
export type HistoryQuery =
  z.infer<
    typeof historyQuerySchema
  >;