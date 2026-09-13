import { z } from "zod";

export const materialIdParamSchema = z.object({
  materialId: z.coerce
    .number()
    .int()
    .positive(),
});

export const inventoryAmountSchema = z.object({
  amount: z.coerce
    .number()
    .int()
    .positive()
    .max(100000),
});

export const setInventorySchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000),

  expectedVersion: z.coerce
    .number()
    .int()
    .positive(),
});

export const listInventoryQuerySchema = z.object({
  sortBy: z
    .enum(["name", "category", "quantity", "status"])
    .default("name"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("asc"),
});

export type ListInventoryQuery =
  z.infer<typeof listInventoryQuerySchema>;

export type InventoryAmountInput =
  z.infer<typeof inventoryAmountSchema>;

export type SetInventoryInput =
  z.infer<typeof setInventorySchema>;