import type { FastifyInstance } from "fastify";

import {
  loginController,
  logoutController,
  meController,
} from "./auth.controller.js";

// Registers authentication-related HTTP routes.
export async function authRoutes(
  app: FastifyInstance,
) {
  app.post("/auth/login", loginController);

  app.post("/auth/logout", logoutController);

  app.get("/auth/me", meController);
}