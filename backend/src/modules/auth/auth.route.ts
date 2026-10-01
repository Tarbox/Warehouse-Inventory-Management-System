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
  app.post(
  "/auth/login",
  {
    config: {
  rateLimit:
    process.env.NODE_ENV === "test"
      ? false
      : {
          max: 5,
          timeWindow: "1 minute",
        },
},
  },
  loginController,
);

  app.post("/auth/logout", logoutController);

  app.get("/auth/me", meController);
}