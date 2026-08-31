import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  listCategories,
} from "./category.service.js";

export async function getCategoriesController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const categories =
    await listCategories();

  return reply.send({
    items: categories,
  });
}