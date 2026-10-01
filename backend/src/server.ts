import "dotenv/config";

import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const app = await buildApp();

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