import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  inventoryAmountSchema,
  materialIdParamSchema,
  setInventorySchema,
  listInventoryQuerySchema
} from "./inventory.schema.js";

import {
  adjustInventory,
  listInventory,
  setInventory,
} from "./inventory.service.js";

export async function getInventoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query =
    listInventoryQuerySchema.safeParse(
      request.query,
    );

  if (!query.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid inventory query",
    });
  }

  const inventory =
    await listInventory(query.data);

  return reply.send({
    items: inventory,
  });
}

export async function incrementInventoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  const body =
    inventoryAmountSchema.safeParse(
      request.body,
    );

  if (!params.success || !body.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid inventory request",
    });
  }

  try {
      if (!request.user) {
    return reply.status(401).send({
      error: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }
    const result =
      await adjustInventory({
        materialId:
          params.data.materialId,

        userId:
          request.user.id,

        amount:
          body.data.amount,

        operation: "INCREMENT",
      });

    return reply.send(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVENTORY_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error: "INVENTORY_NOT_FOUND",
        message: "Inventory record not found",
      });
    }

    throw error;
  }
}

export async function decrementInventoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  const body =
    inventoryAmountSchema.safeParse(
      request.body,
    );

  if (!params.success || !body.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid inventory request",
    });
  }

  try {
    if (!request.user) {
      return reply.status(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    const result =
      await adjustInventory({
        materialId:
          params.data.materialId,

        userId:
          request.user.id,

        amount:
          body.data.amount,

        operation: "DECREMENT",
      });

    return reply.send(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVENTORY_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error: "INVENTORY_NOT_FOUND",
        message: "Inventory record not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "INSUFFICIENT_STOCK"
    ) {
      return reply.status(409).send({
        error: "INSUFFICIENT_STOCK",
        message: "Inventory cannot become negative",
      });
    }

    throw error;
  }
}

export async function setInventoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  const body =
    setInventorySchema.safeParse(
      request.body,
    );

  if (!params.success || !body.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid inventory request",
    });
  }

  try {
    if (!request.user) {
      return reply.status(401).send({
        error: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }

    const result =
      await setInventory({
        materialId:
          params.data.materialId,

        userId:
          request.user.id,

        quantity:
          body.data.quantity,

        expectedVersion:
          body.data.expectedVersion,
      });

    return reply.send(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVENTORY_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error: "INVENTORY_NOT_FOUND",
        message: "Inventory record not found",
      });
    }

    if (
      error instanceof Error &&
      error.message === "VERSION_CONFLICT"
    ) {
      return reply.status(409).send({
        error: "VERSION_CONFLICT",
        message:
          "Inventory was changed by another user",
      });
    }

    throw error;
  }
}