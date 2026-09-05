import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  settingKeyParamSchema,
  updateSettingSchema,
} from "./settings.schema.js";

import {
  listSettings,
  updateSetting,
} from "./settings.service.js";

// Controller function to handle the retrieval of system settings. It fetches all settings from the service layer and sends them back in the HTTP response.
export async function getSettingsController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const settings =
    await listSettings();

  return reply.send({
    items: settings,
  });
}

// Controller function to handle the update of a specific system setting. It validates the request parameters and body, and then calls the service layer to perform the update. The updated setting is returned in the HTTP response.
// It also handles various error scenarios, returning appropriate HTTP status codes and messages for validation errors, forbidden updates, not found settings, and invalid values.
export async function updateSettingController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    settingKeyParamSchema.safeParse(
      request.params,
    );

  const body =
    updateSettingSchema.safeParse(
      request.body,
    );

  if (
    !params.success ||
    !body.success
  ) {
// If validation fails, return HTTP 400 (Bad Request) with an error message indicating invalid setting data.
    return reply.status(400).send({
      error:
        "VALIDATION_ERROR",
      message:
        "Invalid setting data",
    });
  }

// Attempt to update the setting using the service layer. If successful, return the updated setting in the response. If an error occurs, handle it based on the error type and return appropriate HTTP status codes and messages.
  try {
    const setting =
      await updateSetting(
        params.data.key,
        body.data.value,
      );

    return reply.send({
      setting,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SETTING_NOT_ALLOWED"
    ) {
// If the setting key is not allowed to be updated, return HTTP 403 (Forbidden) with an error message indicating that the setting cannot be modified.
// This prevents unauthorized changes to critical system settings that could affect the application's behavior or security.
// This ensures that only specific settings can be modified, preventing unauthorized changes to critical system configurations.
      return reply.status(403).send({
        error:
          "SETTING_NOT_ALLOWED",
        message:
          "This setting cannot be modified",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "SETTING_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "SETTING_NOT_FOUND",
        message:
          "Setting not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_SESSION_DURATION"
    ) {
      return reply.status(400).send({
        error:
          "INVALID_SESSION_DURATION",
        message:
          "Session duration must be between 1 and 168 hours",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_INVENTORY_UNIT"
    ) {
      return reply.status(400).send({
        error:
          "INVALID_INVENTORY_UNIT",
        message:
          "Invalid inventory unit",
      });
    }
// If an unexpected error occurs, rethrow the error to be handled by the global error handler or logging mechanism.
    throw error;
  }
}