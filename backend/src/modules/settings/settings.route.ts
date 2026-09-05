import type {
  FastifyInstance,
} from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import {
  PERMISSIONS,
} from "../auth/permissions.js";

import {
  getSettingsController,
  updateSettingController,
} from "./settings.controller.js";

// The settingsRoutes function registers the routes related to system settings with the Fastify instance. It ensures that only authenticated users with the appropriate permissions can access these routes.
export async function settingsRoutes(
  app: FastifyInstance,
) {
// Register protected routes that require authentication and authorization for managing system settings.
// The routes are prefixed with "/settings" and include endpoints for retrieving and updating settings.
  await app.register(
    async (protectedRoutes) => {
      await protectedRoutes.register(
        authenticate,
      );

      await protectedRoutes.register(
        authorize(
          PERMISSIONS.SETTINGS_MANAGE,
        ),
      );

      protectedRoutes.get(
        "/settings",
        getSettingsController,
      );

      protectedRoutes.patch(
        "/settings/:key",
        updateSettingController,
      );
    },
  );
}