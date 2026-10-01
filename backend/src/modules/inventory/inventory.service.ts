import {
  Prisma,
  type AuditOperation,
} from "../../generated/prisma/client/client.js";
// Import the broadcast function from the realtime manager module.
import {
  broadcast,
} from "../realtime/realtime.manager.js";
import { prisma } from "../../lib/prisma.js";
import type { ListInventoryQuery } from "./inventory.schema.js";

// The function retrieves a list of active materials along with their inventory information from the database.
export async function listInventory(
  query: ListInventoryQuery,
) {

  const { sortBy, sortOrder, categoryId, } = query;

  const orderBy: Prisma.MaterialOrderByWithRelationInput =
    sortBy === "category"
      ? {
          category: {
            name: sortOrder,
          },
        }
      : sortBy === "quantity"
        ? {
            inventory: {
              quantity: sortOrder,
            },
          }
        : {
            name: sortOrder,
          };

  const materials =
    await prisma.material.findMany({
      where: {
        isActive: true,

        ...(categoryId
          ? {
              categoryId,
            }
          : {}),
      },

      include: {
        category: true,
        inventory: true,
      },

      orderBy,
    });
  // Map the retrieved materials to the InventoryItem type and return the result.
  const items = materials.map((material) => {
  const quantity = material.inventory?.quantity ?? 0;

  return {
    id: material.id,
    name: material.name,
    description: material.description,
    unit: material.unit,
    category: {
      id: material.category.id,
      name: material.category.name,
    },
    quantity,
    minimumQuantity: material.minimumQuantity,
    lowStock: quantity <= material.minimumQuantity,
    version: material.inventory?.version ?? 0,
  };
});

if (sortBy === "status") {
  items.sort((a, b) => {
    const aValue = a.lowStock ? 1 : 0;
    const bValue = b.lowStock ? 1 : 0;

    if (aValue !== bValue) {
      return sortOrder === "asc"
        ? aValue - bValue
        : bValue - aValue;
    }

    // Keep the order deterministic when both items have the same status.
    return a.name.localeCompare(b.name);
  });
}

return items;
}
// The function retrieves the inventory information for a specific material by its ID.
type AdjustInventoryInput = {
  materialId: number;
  userId: number;
  amount: number;
  operation: Extract<
    AuditOperation,
    "INCREMENT" | "DECREMENT"
  >;
};
// The function adjusts the inventory quantity for a specific material based on the provided input.
export async function adjustInventory(
  input: AdjustInventoryInput,
) {
  const result =
    await prisma.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<
          Array<{
            id: number;
            materialId: number;
            quantity: number;
            version: number;
          }>// The query retrieves the inventory record for the specified material ID and locks it for update to prevent concurrent modifications.
        >(Prisma.sql`
          SELECT
            id,
            "materialId",
            quantity,
            version
          FROM "Inventory"
          WHERE "materialId" = ${input.materialId}
          FOR UPDATE
        `);
        // If the query returns no rows, it means the inventory record for the specified material ID does not exist, and an error is thrown.
        const inventory = rows[0];
        // If the inventory record for the specified material is not found, throw an error.
        if (!inventory) {
          throw new Error(
            "INVENTORY_NOT_FOUND",
          );
        }

        const oldQuantity =
          inventory.quantity;

        const difference =
          input.operation === "INCREMENT"
            ? input.amount
            : -input.amount;

        const newQuantity =
          oldQuantity + difference;

        if (newQuantity < 0) {
          throw new Error(
            "INSUFFICIENT_STOCK",
          );
        }
        // Update the inventory record with the new quantity and increment the version number to indicate a change.
        const updated =
          await tx.inventory.update({
            where: {
              id: inventory.id,
            },

            data: {
              quantity: newQuantity,

              version: {
                increment: 1,
              },
            },
          });
        // Create a new inventory change record to log the adjustment made to the inventory, including the user who made the change and the operation performed.
        await tx.inventoryChange.create({
          data: {
            userId: input.userId,
            materialId: input.materialId,

            oldQuantity,
            newQuantity,
            difference,

            operation: input.operation,
          },
        });
        // Return the result of the inventory adjustment, including the material ID, old quantity, new quantity, difference, and updated version number.
        return {
          materialId:
            input.materialId,

          oldQuantity,
          newQuantity,
          difference,

          version:
            updated.version,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

  broadcast({
    type: "inventory.updated",

    payload: {
      materialId:
        result.materialId,

      quantity:
        result.newQuantity,

      version:
        result.version,
    },
  });
// Return the result of the inventory adjustment, including the material ID, old quantity, new quantity, difference, and updated version number.
  return result;
}
// The input type for the setInventory function, which includes the material ID, user ID, desired quantity, and expected version of the inventory record.
type SetInventoryServiceInput = {
  materialId: number;
  userId: number;
  quantity: number;
  expectedVersion: number;
};
// The function sets the inventory quantity for a specific material to a desired value, ensuring that the operation is performed only if the expected version matches the current version of the inventory record.
export async function setInventory(
  input: SetInventoryServiceInput,
) {// Perform the inventory update within a transaction to ensure data consistency and handle potential version conflicts.
  const result = await prisma.$transaction(
    async (tx) => {
      const inventory =
        await tx.inventory.findUnique({
          where: {
            materialId: input.materialId,
          },
        });
      // If the inventory record for the specified material is not found, throw an error indicating that the inventory does not exist.
      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }
      // If the current version of the inventory record does not match the expected version provided in the input, throw an error indicating a version conflict.
      if (
        inventory.version !==
        input.expectedVersion
      ) {
        throw new Error("VERSION_CONFLICT");
      }
    
      const oldQuantity =
        inventory.quantity;

      const difference =
        input.quantity - oldQuantity;

      if (difference === 0) {
        return {
          materialId: inventory.materialId,
          oldQuantity,
          newQuantity: oldQuantity,
          difference: 0,
          version: inventory.version,
        };
      }
      // Update the inventory record with the new quantity and increment the version number to indicate a change.
      const updateResult =
        await tx.inventory.updateMany({
          where: {
            id: inventory.id,
            version: input.expectedVersion,
          },

          data: {
            quantity: input.quantity,

            version: {
              increment: 1,
            },
          },
        });

      if (updateResult.count !== 1) {
        throw new Error("VERSION_CONFLICT");
      }

      const updated = {
        ...inventory,
        quantity: input.quantity,
        version: input.expectedVersion + 1,
      };
      // Create a new inventory change record to log the adjustment made to the inventory, including the user who made the change and the operation performed.
      await tx.inventoryChange.create({
        data: {
          userId: input.userId,
          materialId: inventory.materialId,

          oldQuantity,
          newQuantity: input.quantity,
          difference,

          operation: "SET",
        },
      });

      return {
        materialId: inventory.materialId,
        oldQuantity,
        newQuantity: input.quantity,
        difference,
        version: updated.version,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
  // Broadcast the inventory update event to all connected clients using the broadcast function from the realtime manager module.
  broadcast({
    type: "inventory.updated",

    payload: {
      materialId:
        result.materialId,

      quantity:
        result.newQuantity,

      version:
        result.version,
    },
  });
  
  return result;
}