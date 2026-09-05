import { prisma } from "../../lib/prisma.js";

import {
  toSettingDto,
} from "./settings.dto.js";

// List of allowed setting keys that can be updated in the system.
// This ensures that only specific settings can be modified, preventing unauthorized changes to critical system configurations.
const ALLOWED_SETTINGS = [
  "session_duration_hours",
  "default_inventory_unit",
] as const;

// TypeScript type representing the allowed setting keys, derived from the ALLOWED_SETTINGS array.
type SettingKey =
  (typeof ALLOWED_SETTINGS)[number];


// listSettings retrieves all system settings from the database that are included in the ALLOWED_SETTINGS array, and returns them as an array of setting DTOs.
// This function is used to fetch the current configuration of the system for display or management purposes.
export async function listSettings() {
  const settings =
    await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [...ALLOWED_SETTINGS],
        },
      },

      orderBy: {
        key: "asc",
      },
    });

// Map the retrieved settings to the SettingDto type and return the result.
  return settings.map(
    toSettingDto,
  );
}

// updateSetting updates the value of a specific system setting identified by its key. It validates the key against the ALLOWED_SETTINGS array and performs additional validation based on the specific setting being updated (e.g., session duration and inventory unit).
// If the key is valid and the value passes validation, the setting is updated in the database and the updated setting is returned as a setting DTO.
export async function updateSetting(
  key: string,
  value: string,
) {
  if (
    !ALLOWED_SETTINGS.includes(
      key as SettingKey,
    )
  ) {
    throw new Error(
      "SETTING_NOT_ALLOWED",
    );
  }

// Retrieve the existing setting from the database to ensure it exists before attempting to update it.
// This check prevents attempts to update non-existent settings, which could lead to inconsistencies in the system configuration.
  const setting =
    await prisma.systemSetting.findUnique({
      where: {
        key,
      },
    });

  if (!setting) {
    throw new Error(
      "SETTING_NOT_FOUND",
    );
  }

  if (
    key ===
      "session_duration_hours"
  ) {
// Additional validation for the "session_duration_hours" setting to ensure that the provided value is a valid integer between 1 and 168 (representing hours).
    const hours =
      Number(value);

    if (
      !Number.isInteger(hours) ||
      hours < 1 ||
      hours > 168
    ) {
      throw new Error(
        "INVALID_SESSION_DURATION",
      );
    }
  }
// Additional validation for the "default_inventory_unit" setting to ensure that the provided value is one of the allowed inventory units.
// This prevents invalid inventory units from being set, which could lead to inconsistencies in inventory management.
  if (
    key ===
      "default_inventory_unit"
  ) {
    const allowedUnits = [
      "PCS",
      "BOX",
      "ROLL",
      "PACK",
      "PAIR",
      "OTHER",
    ];

    if (
      !allowedUnits.includes(value)
    ) {
      throw new Error(
        "INVALID_INVENTORY_UNIT",
      );
    }
  }

// Update the setting in the database with the new value and return the updated setting as a DTO.
// This ensures that the system configuration is updated correctly and that clients receive the latest setting information.
  const updated =
    await prisma.systemSetting.update({
      where: {
        key,
      },

      data: {
        value,
      },
    });

// Return the updated setting as a DTO to the caller, providing a consistent representation of the setting for client consumption.
  return toSettingDto(updated);
}