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