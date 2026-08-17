import { prisma } from "../../lib/prisma.js";
import type { ListMaterialsQuery } from "./material.schema.js";

export async function listMaterials(query: ListMaterialsQuery) {
  const {
    search,
    categoryId,
    lowStock,
    page,
    limit,
  } = query;

  const skip = (page - 1) * limit;

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

    ...(categoryId
      ? {
          categoryId,
        }
      : {}),
  };

  const [materials, total] = await prisma.$transaction([
    prisma.material.findMany({
      where,

      include: {
        category: true,
        inventory: true,
      },

      orderBy: {
        name: "asc",
      },

      skip,
      take: limit,
    }),

    prisma.material.count({
      where,
    }),
  ]);

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

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}