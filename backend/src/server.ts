import Fastify from "fastify";
import cors from "@fastify/cors";

import { prisma } from "./lib/prisma.js";

const app = Fastify({
  logger: true,
});

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

start();