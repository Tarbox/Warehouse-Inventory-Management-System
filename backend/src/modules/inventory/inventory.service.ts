import {
  Prisma,
  type AuditOperation,
} from "../../generated/prisma/client/client.js";

import { prisma } from "../../lib/prisma.js";

export async function listInventory() {
  const materials =
    await prisma.material.findMany({
      where: {
        isActive: true,
      },

      include: {
        category: true,
        inventory: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  return materials.map((material) => {
    const quantity =
      material.inventory?.quantity ?? 0;

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
      minimumQuantity:
        material.minimumQuantity,

      lowStock:
        quantity <= material.minimumQuantity,

      version:
        material.inventory?.version ?? 0,
    };
  });
}

type AdjustInventoryInput = {
  materialId: number;
  userId: number;
  amount: number;
  operation: Extract<
    AuditOperation,
    "INCREMENT" | "DECREMENT"
  >;
};

export async function adjustInventory(
  input: AdjustInventoryInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: number;
          materialId: number;
          quantity: number;
          version: number;
        }>
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

      const inventory = rows[0];

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      const oldQuantity = inventory.quantity;

      const difference =
        input.operation === "INCREMENT"
          ? input.amount
          : -input.amount;

      const newQuantity =
        oldQuantity + difference;

      if (newQuantity < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

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

      return {
        materialId: input.materialId,
        oldQuantity,
        newQuantity,
        difference,
        version: updated.version,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}

type SetInventoryServiceInput = {
  materialId: number;
  userId: number;
  quantity: number;
  expectedVersion: number;
};

export async function setInventory(
  input: SetInventoryServiceInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const inventory =
        await tx.inventory.findUnique({
          where: {
            materialId: input.materialId,
          },
        });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

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

      const updated =
        await tx.inventory.update({
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
}