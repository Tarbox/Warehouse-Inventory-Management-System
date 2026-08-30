import { prisma } from "../../lib/prisma.js";
import type { ListMaterialsQuery } from "./material.schema.js";

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
  
  // Transform the database records into the data structure
  // that the API should return to the client.
  const items = materials
    .map((material) => {
      if (!material.inventory) {
        return {
          id: material.id,
          name: material.name,
          description: material.description,
          unit: material.unit,
          minimumQuantity: material.minimumQuantity,
          quantity: 0,
          lowStock: true,
          category: {
            id: material.category.id,
            name: material.category.name,
          },
        };
      }

      return {
        id: material.id,
        name: material.name,
        description: material.description,
        unit: material.unit,
        minimumQuantity: material.minimumQuantity,
        quantity: material.inventory.quantity,
        lowStock:
          material.inventory.quantity <=
          material.minimumQuantity,
        category: {
          id: material.category.id,
          name: material.category.name,
        },
      };
    })
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
) {// Use a database transaction to ensure that both the material and its inventory record are created atomically.
  return prisma.$transaction(
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
      // Check if a material with the same name already exists in the specified category to prevent duplicates.
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
      // Create the new material record in the database with the provided input data.
      const material =
        await tx.material.create({
          data: {
            name: input.name,
            // If the description is not provided, set it to null in the database.
            description:
              input.description ??
              null,
            // Set the unit, minimum quantity, and category ID for the new material.
            unit: input.unit,

            minimumQuantity:
              input.minimumQuantity,

            categoryId:
              input.categoryId,
          },
        });
      // Create the initial inventory record for the new material with the specified initial quantity and set the version to 1.
      await tx.inventory.create({
        data: {
          materialId: material.id,
          quantity:
            input.initialQuantity,
          version: 1,
        },
      });
      // Return the newly created material record to the caller.
      return material;
    },
  );
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
) {// Check if the material with the specified ID exists in the database.
  const material =
    await prisma.material.findUnique({
      where: { id },
    });
  // If the material does not exist, throw an error indicating that it was not found.
  if (!material) {
    throw new Error(
      "MATERIAL_NOT_FOUND",
    );
  }
  // If a category ID is provided in the input, check if the specified category exists in the database.
  if (input.categoryId) {
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
  // Update the material record in the database with the provided input data.
  return prisma.material.update({
    where: {
      id,
    },
    // Spread the input data into the update operation, allowing for partial updates of the material's properties.
    data: {
      ...input,
    },
  });
}

// The function deletes a material from the database by marking it as inactive. It checks for the existence of the material before performing the deletion.
export async function deleteMaterial(
  id: number,
) {// Check if the material with the specified ID exists in the database.
  const material =
    await prisma.material.findUnique({
      where: {
        id,
      },
    });
  // If the material does not exist, throw an error indicating that it was not found.
  if (!material) {
    throw new Error(
      "MATERIAL_NOT_FOUND",
    );
  }
  // Mark the material as inactive in the database instead of physically deleting it. This allows for soft deletion and preserves historical data.
  return prisma.material.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });
}