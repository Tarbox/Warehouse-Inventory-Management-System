import fp from "fastify-plugin";

import {
  SESSION_COOKIE_NAME,
} from "../modules/auth/auth.constants.js";

import {
  getCurrentUser,
} from "../modules/auth/auth.service.js";

// Extend the FastifyRequest type with a custom "user" property.
// The property type is inferred from the return value of getCurrentUser().
declare module "fastify" {
  interface FastifyRequest {
    user: Awaited<
      ReturnType<typeof getCurrentUser>
    >;
  }
}

export default fp(async (app) => {
  // Add the "user" property to every Fastify request.
  // It is initialized as null and will be replaced
  // with the authenticated user after successful authentication.
  app.decorateRequest("user", null);

  // Run authentication before the route handler is executed.
  app.addHook(
    "preHandler",
    async (request, reply) => {
      // Read the session ID from the request cookie.
      const sessionId =
        request.cookies[SESSION_COOKIE_NAME];

      // Reject the request if no session cookie is provided.
      if (!sessionId) {
        return reply.status(401).send({
          error: "UNAUTHENTICATED",
          message: "Authentication required",
        });
      }

      // Resolve the current user using the session ID.
      const user =
        await getCurrentUser(sessionId);

      // Reject the request if the session is invalid
      // or no user can be associated with it.
      if (!user) {
        return reply.status(401).send({
          error: "UNAUTHENTICATED",
          message: "Authentication required",
        });
      }

      // Attach the authenticated user to the current request.
      // Other parts of the request lifecycle can now access request.user.
      request.user = user;
    },
  );
});