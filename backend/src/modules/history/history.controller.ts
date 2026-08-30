import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  historyQuerySchema,
} from "./history.schema.js";

import {
  listHistory,
} from "./history.service.js";

// The controller function handles HTTP requests to retrieve inventory change history records.
export async function getHistoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query =
    historyQuerySchema.safeParse(
      request.query,
    );
// If the query parameters are invalid, return a 400 Bad Request response with validation error details.
  if (!query.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message:
        "Invalid history filters",
      details:// Return structured validation details to help identify which query parameters are invalid.
        query.error.flatten(),
    });
  }

// Call the service layer to retrieve the history records based on the validated query parameters.
  const result =
    await listHistory(query.data);

// Send the retrieved history records back to the client as the HTTP response.
  return reply.send(result);
}