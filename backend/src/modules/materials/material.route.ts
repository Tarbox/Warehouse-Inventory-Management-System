import type { FastifyInstance } from "fastify";

import { getMaterials } from "./material.controller.js";

export async function materialRoutes(
  app: FastifyInstance,
) {
  app.get("/materials", getMaterials);
}