import type { FastifyInstance } from "fastify";

import { materialRoutes } from "../modules/materials/material.route.js";

export async function registerRoutes(
  app: FastifyInstance,
) {
  await app.register(materialRoutes, {
    prefix: "/api",
  });
}