import fp from "fastify-plugin";

import {
  SESSION_COOKIE_NAME,
} from "../modules/auth/auth.constants.js";

import {
  getCurrentUser,
} from "../modules/auth/auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    user: Awaited<
      ReturnType<typeof getCurrentUser>
    >;
  }
}

export default fp(async (app) => {
  app.decorateRequest("user", null);

  app.addHook(
    "preHandler",
    async (request, reply) => {
      const sessionId =
        request.cookies[SESSION_COOKIE_NAME];

      if (!sessionId) {
        return reply.status(401).send({
          error: "UNAUTHENTICATED",
          message: "Authentication required",
        });
      }

      const user =
        await getCurrentUser(sessionId);

      if (!user) {
        return reply.status(401).send({
          error: "UNAUTHENTICATED",
          message: "Authentication required",
        });
      }

      request.user = user;
    },
  );
});