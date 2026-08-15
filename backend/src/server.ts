import Fastify from "fastify";
import cors from "@fastify/cors";

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

const start = async () => {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: 4000,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();