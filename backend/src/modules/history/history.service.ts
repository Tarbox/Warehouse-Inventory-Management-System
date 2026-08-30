import { prisma } from "../../lib/prisma.js";

import type { HistoryQuery } from "./history.schema.js";

// The function retrieves a paginated list of inventory change history records based on the provided query parameters.
export async function listHistory(
  query: HistoryQuery,
) {// Destructure the query parameters for easier access.
  const {
    userId,
    materialId,
    operation,
    page,
    limit,
  } = query;

// Build the Prisma "where" filter object dynamically based on the provided query parameters.
  const where = {
    ...(userId
      ? { userId }
      : {}),

    ...(materialId
      ? { materialId }
      : {}),

    ...(operation
      ? { operation }
      : {}),
  };

// Calculate how many records should be skipped for the current page.
  const skip =
    (page - 1) * limit;

// Use a Prisma transaction to retrieve both the list of history records and the total count of matching records in a single database call.
  const [items, total] =
    await prisma.$transaction([
      prisma.inventoryChange.findMany({
        where,

        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },

          material: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },

// Order the history records by creation date in descending order to show the most recent changes first.
        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.inventoryChange.count({
        where,
      }),
    ]);

// Return the retrieved history records along with pagination information to the caller.
return {
  items: items.map((item) => ({
    id: item.id.toString(),

    user: {
      id: item.user.id,
      username: item.user.username,
    },

    material: {
      id: item.material.id,
      name: item.material.name,
      unit: item.material.unit,
    },

    oldQuantity: item.oldQuantity,
    newQuantity: item.newQuantity,
    difference: item.difference,
    operation: item.operation,
    createdAt: item.createdAt,
  })),

  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(
      total / limit,
    ),
  },
};
}