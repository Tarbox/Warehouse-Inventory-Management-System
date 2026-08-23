import type { FastifyInstance } from "fastify";

import { authRoutes } from "../modules/auth/auth.route.js";
import { materialRoutes } from "../modules/materials/material.route.js";
import { inventoryRoutes } from "../modules/inventory/inventory.route.js";

export async function registerRoutes(
  app: FastifyInstance,
) {
  await app.register(authRoutes, {
    prefix: "/api",
  });

  await app.register(materialRoutes, {
    prefix: "/api",
  });

  await app.register(inventoryRoutes, {
    prefix: "/api",
  });
}