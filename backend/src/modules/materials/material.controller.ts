import type { FastifyReply, FastifyRequest } from "fastify";

import { listMaterialsQuerySchema } from "./material.schema.js";
import { listMaterials } from "./material.service.js";

export async function getMaterials(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsedQuery = listMaterialsQuerySchema.safeParse(
    request.query,
  );

  if (!parsedQuery.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid query parameters",
      details: parsedQuery.error.flatten(),
    });
  }

  const result = await listMaterials(parsedQuery.data);

  return reply.send(result);
}