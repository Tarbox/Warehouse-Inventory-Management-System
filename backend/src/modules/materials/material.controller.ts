import type { FastifyReply, FastifyRequest } from "fastify";

import { 
  createMaterialSchema, 
  listMaterialsQuerySchema, 
  materialIdParamSchema, 
  updateMaterialSchema 
} from "./material.schema.js";
import { 
  createMaterial, 
  deleteMaterial, 
  getMaterialById, 
  listMaterials, 
  updateMaterial 
} from "./material.service.js";

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

// The following controller functions handle HTTP requests for individual materials.
export async function getMaterialController(
  request: FastifyRequest,
  reply: FastifyReply,
) {// Validate and parse the material ID from the request parameters.
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  if (!params.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid material ID",
    });
  }
// Retrieve the material from the service layer using the validated ID.
  const material =
    await getMaterialById(
      params.data.id,
    );

  if (!material) {
    return reply.status(404).send({
      error: "MATERIAL_NOT_FOUND",
      message: "Material not found",
    });
  }
// Return the retrieved material as the HTTP response.
  return reply.send({
    material,
  });
}

// The following controller functions handle HTTP requests for creating, updating, and deleting materials.
export async function createMaterialController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body =
    createMaterialSchema.safeParse(
      request.body,
    );

  if (!body.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid material data",
      details:
        body.error.flatten(),
    });
  }
// Call the service layer to create a new material using the validated input data.
  try {
    const material =
      await createMaterial(
        body.data,
      );

    return reply.status(201).send({
      material,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {// If the specified category does not exist, return a 400 Bad Request response with an appropriate error message.
      return reply.status(400).send({
        error:
          "CATEGORY_NOT_FOUND",
        message:
          "Category does not exist",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "MATERIAL_ALREADY_EXISTS"
    ) {
      return reply.status(409).send({
        error:
          "MATERIAL_ALREADY_EXISTS",
        message:
          "Material already exists",
      });
    }

    throw error;
  }
}

// The following controller functions handle HTTP requests for updating and deleting materials.
export async function updateMaterialController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  const body =
    updateMaterialSchema.safeParse(
      request.body,
    );

  if (
    !params.success ||
    !body.success
  ) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid material data",
    });
  }
// Call the service layer to update the material using the validated ID and input data.
  try {
    const material =
      await updateMaterial(
        params.data.id,
        body.data,
      );

    return reply.send({
      material,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "MATERIAL_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "MATERIAL_NOT_FOUND",
        message:
          "Material not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {
      return reply.status(400).send({
        error:
          "CATEGORY_NOT_FOUND",
        message:
          "Category does not exist",
      });
    }
    if (
      error instanceof Error &&
      error.message ===
        "MATERIAL_ALREADY_EXISTS"
    ) {
      return reply.status(409).send({
        error:
          "MATERIAL_ALREADY_EXISTS",

        message:
          "A material with this name already exists in this category",
      });
    }
    
    throw error;
  }
}

// The following controller function handles HTTP requests for deleting a material.
export async function deleteMaterialController(
  request: FastifyRequest,
  reply: FastifyReply,
) {// Validate and parse the material ID from the request parameters.
  const params =
    materialIdParamSchema.safeParse(
      request.params,
    );

  if (!params.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid material ID",
    });
  }

  try {
    await deleteMaterial(
      params.data.id,
    );

    return reply.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "MATERIAL_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "MATERIAL_NOT_FOUND",
        message:
          "Material not found",
      });
    }

    throw error;
  }
}
