import type { FastifyInstance } from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import { PERMISSIONS } from "../auth/permissions.js";

import { getMaterials } from "./material.controller.js";

export async function materialRoutes(
  app: FastifyInstance,
) {
  // Plugins registered inside this scope will apply to these routes.
  await app.register(async (protectedRoutes) => {

    // Authenticate the user before allowing access to the route.
    // This verifies that the request comes from an authenticated user.
    await protectedRoutes.register(authenticate);

    // Check whether the authenticated user has permission to read inventory data.
    await protectedRoutes.register(
      authorize(PERMISSIONS.INVENTORY_READ),
    );

    // GET /materials
    // The request reaches getMaterials only after
    // authentication and authorization have passed.
    protectedRoutes.get(
      "/materials",
      getMaterials,
    );
  });
}