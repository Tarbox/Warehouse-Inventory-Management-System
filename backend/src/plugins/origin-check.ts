import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

// This plugin checks the origin of incoming requests for mutating HTTP methods (POST, PUT, PATCH, DELETE).
const MUTATING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

// The plugin reads the allowed origin from the environment variable CORS_ORIGIN.
export default fp(async (app) => {
  const allowedOrigin = (
    process.env.CORS_ORIGIN ??
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim());

// The plugin adds a hook to the Fastify application that runs before each request is processed.
  app.addHook(
    "onRequest",
    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      if (!MUTATING_METHODS.has(request.method)) {
        return;
      }
// The plugin checks the origin of the request against the allowed origin.
      const origin = request.headers.origin;

// Non-browser clients such as curl may not send Origin.
      if (!origin) {
        return;
      }
// If the origin does not match the allowed origin, the plugin responds with a 403 Forbidden status.
      if (!allowedOrigin.includes(origin)) {
        return reply.status(403).send({
          error: "FORBIDDEN_ORIGIN",
          message: "Request origin is not allowed",
        });
      }
    },
  );
});