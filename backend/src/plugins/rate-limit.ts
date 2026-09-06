import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

// This plugin registers the rate limiting functionality with the Fastify application.
// It uses the `@fastify/rate-limit` package to limit the number of requests a client can make to the server within a specified time window.
// The `global: false` option indicates that rate limiting is not applied globally to all routes, allowing for more granular control over which routes have rate limiting enabled.
export default fp(async (app) => {
  await app.register(rateLimit, {
    global: false,
  });
});