import { z } from "zod";

export const userIdParamSchema =
  z.object({
    id: z.coerce
      .number()
      .int()
      .positive(),
  });

export const createUserSchema =
  z.object({
    username: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Username contains invalid characters",
      ),

    password: z
      .string()
      .min(8)
      .max(200),

    roleId: z
      .number()
      .int()
      .positive(),
  });

export const updateUserRoleSchema =
  z.object({
    roleId: z
      .number()
      .int()
      .positive(),
  });

export const resetPasswordSchema =
  z.object({
    password: z
      .string()
      .min(8)
      .max(200),
  });