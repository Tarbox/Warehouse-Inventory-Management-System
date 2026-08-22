export const PERMISSIONS = {
  INVENTORY_READ: "inventory.read",
  INVENTORY_UPDATE: "inventory.update",

  INVENTORY_CREATE: "inventory.create",
  INVENTORY_DELETE: "inventory.delete",

  USERS_MANAGE: "users.manage",
  MATERIALS_MANAGE: "materials.manage",
  SETTINGS_MANAGE: "settings.manage",
  HISTORY_READ: "history.read",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];