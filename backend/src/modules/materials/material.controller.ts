import type { FastifyReply, FastifyRequest } from "fastify";

import { listMaterialsQuerySchema } from "./material.schema.js";
import { listMaterials } from "./material.service.js";

export async function getMaterials(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Validate and parse query parameters received from the HTTP request.
  const parsedQuery = listMaterialsQuerySchema.safeParse(
    request.query,
  );

  // If validation fails, stop processing the request
  // and return HTTP 400 (Bad Request) to the client.
  if (!parsedQuery.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid query parameters",

      // Return structured validation details to help identify
      // which query parameters are invalid.
      details: parsedQuery.error.flatten(),
    });
  }

  // Pass the validated and parsed query data to the service layer.
  // The controller handles HTTP concerns,
  // while the service contains the application/business logic.
  const result = await listMaterials(parsedQuery.data);

  // Send the service result back to the client as the HTTP response.
  return reply.send(result);
}