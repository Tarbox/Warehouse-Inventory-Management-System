import { prisma } from "../../lib/prisma.js";
import type { ListMaterialsQuery } from "./material.schema.js";
import { toMaterialDto } from "./material.dto.js";
import {
  broadcast,
  } from "../realtime/realtime.manager.js"
export async function listMaterials(query: ListMaterialsQuery) {
  // Extract filtering and pagination parameters from the request query.
  const {
    search,
    categoryId,
    lowStock,
    page,
    limit,
  } = query;

  // Calculate how many records should be skipped for the current page.
  // Example: page 2 with limit 10 → skip 10 records.
  const skip = (page - 1) * limit;

  // Build Prisma filters dynamically.
  // Only add search/category filters when the corresponding values are provided.
  const where = {
    isActive: true,

    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),

  // If a category ID is provided, return materials from that category only.
    ...(categoryId
      ? {
          categoryId,
        }
      : {}),
  };

  // Get both the requested materials and the total number of matching records.
  // The total is needed to calculate pagination information.
  const [materials, total] = await prisma.$transaction([
    prisma.material.findMany({
      where,

      // Load related category and inventory data together with each material.
      include: {
        category: true,
        inventory: true,
      },

      orderBy: {
        name: "asc",
      },

  // Pagination:
  // skip → number of records to skip
  // take → maximum number of records to return
      skip,
      take: limit,
    }),

    prisma.material.count({
      where,
    }),
  ]);
  
  // Map the retrieved materials to the MaterialDto type and filter by low stock if requested.
  const items = materials
  .map(toMaterialDto)
  .filter((material) => {
    if (lowStock === undefined) {
      return true;
    }

    return material.lowStock === lowStock;
  });


  // Return both the materials and pagination metadata.
  return {
    items,
    pagination: {
      page,
      limit,
      total,

  // Calculate the total number of pages.
      totalPages: Math.ceil(total / limit),
    },
  };
}

// The function retrieves a specific material by its ID from the database.
export async function getMaterialById(
  id: number,
) {
  return prisma.material.findUnique({
    where: {
      id,
    },

    include: {
      category: true,
      inventory: true,
    },
  });
}

// The function retrieves a specific material by its ID from the database and throws an error if the material is not found.
type CreateMaterialInput = {
  name: string;
  description?: string | null;
  unit:
    | "PCS"
    | "BOX"
    | "ROLL"
    | "PACK"
    | "PAIR"
    | "OTHER";
  minimumQuantity: number;
  categoryId: number;
  initialQuantity: number;
};

// The function creates a new material in the database along with its initial inventory record.
export async function createMaterial(
  input: CreateMaterialInput,
) {
  const result = await prisma.$transaction(
    async (tx) => {
      const category =
        await tx.category.findUnique({
          where: {
            id: input.categoryId,
          },
        });

      if (!category) {
        throw new Error(
          "CATEGORY_NOT_FOUND",
        );
      }

      const existing =
        await tx.material.findFirst({
          where: {
            categoryId:
              input.categoryId,
            name: input.name,
          },
        });

      if (existing) {
        throw new Error(
          "MATERIAL_ALREADY_EXISTS",
        );
      }

      const material =
        await tx.material.create({
          data: {
            name: input.name,
            description:
              input.description ?? null,
            unit: input.unit,
            minimumQuantity:
              input.minimumQuantity,
            categoryId:
              input.categoryId,
          },
        });

      await tx.inventory.create({
        data: {
          materialId: material.id,
          quantity:
            input.initialQuantity,
          version: 1,
        },
      });

      return material;
    },
  );

  broadcast({
    type: "material.created",
    payload: {
      materialId: result.id,
    },
  });

  return result;
}

// The function updates an existing material in the database with the provided input data. It checks for the existence of the material and category before performing the update.
type UpdateMaterialInput = {
  name?: string;
  description?: string | null;
  unit?:
    | "PCS"
    | "BOX"
    | "ROLL"
    | "PACK"
    | "PAIR"
    | "OTHER";
  minimumQuantity?: number;
  categoryId?: number;
};
// The function updates an existing material in the database with the provided input data. It checks for the existence of the material and category before performing the update.
export async function updateMaterial(
  id: number,
  input: UpdateMaterialInput,
) {
  const material =
    await prisma.material.findUnique({
      where: {
        id,
      },
    });

  if (!material) {
    throw new Error(
      "MATERIAL_NOT_FOUND",
    );
  }

  const newName =
    input.name ?? material.name;

  const newCategoryId =
    input.categoryId ??
    material.categoryId;

  /*
   * Check whether another material
   * with the same name exists
   * in the target category.
   */
  const duplicate =
    await prisma.material.findFirst({
      where: {
        name: newName,
        categoryId: newCategoryId,

        id: {
          not: id,
        },
      },
    });

  if (duplicate) {
    throw new Error(
      "MATERIAL_ALREADY_EXISTS",
    );
  }

  /*
   * If category is being changed,
   * make sure the target category exists.
   */
  if (input.categoryId !== undefined) {
    const category =
      await prisma.category.findUnique({
        where: {
          id: input.categoryId,
        },
      });

    if (!category) {
      throw new Error(
        "CATEGORY_NOT_FOUND",
      );
    }
  }

  const result = await prisma.material.update({
  where: {
    id,
  },

  data: {
    ...(input.name !== undefined && {
      name: input.name,
    }),

    ...(input.description !== undefined && {
      description: input.description,
    }),

    ...(input.unit !== undefined && {
      unit: input.unit,
    }),

    ...(input.minimumQuantity !== undefined && {
      minimumQuantity:
        input.minimumQuantity,
    }),

    ...(input.categoryId !== undefined && {
      categoryId: input.categoryId,
    }),
  },
});

broadcast({
  type: "material.updated",
  payload: {
    materialId: result.id,
  },
});

return result;
}

// The function deletes a material from the database by marking it as inactive. It checks for the existence of the material before performing the deletion.
export async function deleteMaterial(
  id: number,
) {
  const material =
    await prisma.material.findUnique({
      where: {
        id,
      },
    });

  if (!material) {
    throw new Error(
      "MATERIAL_NOT_FOUND",
    );
  }

  const result =
    await prisma.material.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });

  broadcast({
    type: "material.deleted",
    payload: {
      materialId: id,
    },
  });

  return result;
}