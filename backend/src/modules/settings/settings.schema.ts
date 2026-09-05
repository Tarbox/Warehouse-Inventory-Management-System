import { z } from "zod";

// Schema for updating a system setting, ensuring the value is a non-empty string with a maximum length of 500 characters.
export const updateSettingSchema =
  z.object({
    value: z
      .string()
      .trim()
      .min(1)
      .max(500),
  });

// Schema for validating the key parameter of a system setting, ensuring it is a non-empty string with a maximum length of 100 characters.
export const settingKeyParamSchema =
  z.object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(100),
  });

// TypeScript type inferred from the updateSettingSchema, representing the input required to update a system setting.
export type UpdateSettingInput =
  z.infer<
    typeof updateSettingSchema
  >;