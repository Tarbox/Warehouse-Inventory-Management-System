import type { FastifyInstance } from "fastify";

import { authRoutes } from "../modules/auth/auth.route.js";
import { inventoryRoutes } from "../modules/inventory/inventory.route.js";
import { materialRoutes } from "../modules/materials/material.route.js";
import { realtimeRoutes } from "../modules/realtime/realtime.route.js";
import { historyRoutes } from "../modules/history/history.route.js";
import { categoryRoutes } from "../modules/categories/category.route.js";
import { userRoutes } from "../modules/users/user.route.js";
import { settingsRoutes } from "../modules/settings/settings.route.js";
// The function registers all the routes with the Fastify instance.
export async function registerRoutes(
  app: FastifyInstance,
) {
  // Register the authentication routes with the Fastify instance.
  await app.register(authRoutes, {
    prefix: "/api",
  });
  // Register the material routes with the Fastify instance.
  await app.register(materialRoutes, {
    prefix: "/api",
  });
  // Register the inventory routes with the Fastify instance.
  await app.register(inventoryRoutes, {
    prefix: "/api",
  });
  // Register the realtime routes with the Fastify instance.
  await app.register(realtimeRoutes, {
    prefix: "/api",
  });
  // Register the history routes with the Fastify instance.
  await app.register(historyRoutes, {
    prefix: "/api",
  });
  // Register the category routes with the Fastify instance.
  await app.register(categoryRoutes, {
    prefix: "/api",
  });
  // Register the user routes with the Fastify instance.
  await app.register(userRoutes, {
    prefix: "/api",
  });
  // Register the settings routes with the Fastify instance.
  await app.register(settingsRoutes, {
    prefix: "/api",
  });
}