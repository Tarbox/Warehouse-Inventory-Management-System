import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js";

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
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

export async function createCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input =
    createCategorySchema.parse(
      request.body,
    );

  try {
    const category =
      await createCategory(input);

    return reply
      .code(201)
      .send(category);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_ALREADY_EXISTS"
    ) {
      return reply.code(409).send({
        error: "CATEGORY_ALREADY_EXISTS",
        message:
          "Category already exists",
      });
    }

    throw error;
  }
}

export async function updateCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } =
    categoryIdParamSchema.parse(
      request.params,
    );

  const input =
    updateCategorySchema.parse(
      request.body,
    );

  try {
    const category =
      await updateCategory(
        id,
        input,
      );

    return reply.send(category);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {
      return reply.code(404).send({
        error: "CATEGORY_NOT_FOUND",
        message:
          "Category not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_ALREADY_EXISTS"
    ) {
      return reply.code(409).send({
        error: "CATEGORY_ALREADY_EXISTS",
        message:
          "Category already exists",
      });
    }

    throw error;
  }
}

export async function deleteCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } =
    categoryIdParamSchema.parse(
      request.params,
    );

  try {
    await deleteCategory(id);

    return reply.code(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {
      return reply.code(404).send({
        error: "CATEGORY_NOT_FOUND",
        message:
          "Category not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_IN_USE"
    ) {
      return reply.code(409).send({
        error: "CATEGORY_IN_USE",
        message:
          "Category cannot be deleted because it is used by materials",
      });
    }

    throw error;
  }
}