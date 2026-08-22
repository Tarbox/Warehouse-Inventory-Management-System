import "dotenv/config";
import cookie from "@fastify/cookie";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { prisma } from "./lib/prisma.js";
import { registerRoutes } from "./routes/index.js";

const app = Fastify({
  logger: true,
});
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  const err = error as Error & { statusCode?: number };

  if (err.statusCode && err.statusCode < 500) {
    return reply.status(err.statusCode).send({
      error: "REQUEST_ERROR",
      message: err.message,
    });
  }

  return reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
});
await app.register(cookie);

await app.register(cors, {
  origin: "http://localhost:3000",
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "backend",
  };
});

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    database: "connected",
  };
});

await registerRoutes(app);

const start = async () => {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: 4000,
    });
  } catch (error) {
    app.log.error(error);

    await prisma.$disconnect();

    process.exit(1);
  }
};

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();