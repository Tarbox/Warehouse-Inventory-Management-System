import "dotenv/config";
import argon2 from "argon2";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} environment variable is required`,
    );
  }

  return value;
}

const databaseUrl = requireEnv(
  "DATABASE_URL",
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const adminPassword = requireEnv(
  "SEED_ADMIN_PASSWORD",
);

const workerPassword = requireEnv(
  "SEED_WORKER_PASSWORD",
);

if (!adminPassword || !workerPassword) {
  throw new Error(
    "SEED_ADMIN_PASSWORD and SEED_WORKER_PASSWORD must be configured",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting database seed...");

  /*
   * ------------------------------------------------------
   * Roles
   * ------------------------------------------------------
   */

  const workerRole = await prisma.role.upsert({
    where: {
      name: "WORKER",
    },
    update: {
      description: "Regular warehouse employee",
    },
    create: {
      name: "WORKER",
      description: "Regular warehouse employee",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      name: "ADMIN",
    },
    update: {
      description: "Warehouse administrator",
    },
    create: {
      name: "ADMIN",
      description: "Warehouse administrator",
    },
  });

  /*
   * ------------------------------------------------------
   * Password hashes
   * ------------------------------------------------------
   */

  const adminPasswordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
  });

  const workerPasswordHash = await argon2.hash(workerPassword, {
    type: argon2.argon2id,
  });

  /*
   * ------------------------------------------------------
   * Users
   * ------------------------------------------------------
   */

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const worker = await prisma.user.upsert({
    where: {
      username: "worker",
    },
    update: {
      passwordHash: workerPasswordHash,
      roleId: workerRole.id,
      isActive: true,
    },
    create: {
      username: "worker",
      passwordHash: workerPasswordHash,
      roleId: workerRole.id,
      isActive: true,
    },
  });

  /*
   * ------------------------------------------------------
   * Categories
   * ------------------------------------------------------
   */

  const packaging = await prisma.category.upsert({
    where: {
      name: "Packaging",
    },
    update: {},
    create: {
      name: "Packaging",
      description: "Packaging materials",
    },
  });

  const boxes = await prisma.category.upsert({
    where: {
      name: "Boxes",
    },
    update: {},
    create: {
      name: "Boxes",
      description: "Cardboard boxes",
    },
  });

  const labels = await prisma.category.upsert({
    where: {
      name: "Labels",
    },
    update: {},
    create: {
      name: "Labels",
      description: "Labels and printing materials",
    },
  });

  const safety = await prisma.category.upsert({
    where: {
      name: "Safety",
    },
    update: {},
    create: {
      name: "Safety",
      description: "Personal protective equipment",
    },
  });

  /*
   * ------------------------------------------------------
   * Materials
   * ------------------------------------------------------
   */

  const materials = [
    {
      name: "Scotch",
      categoryId: packaging.id,
      unit: "PCS" as const,
      minimumQuantity: 10,
      quantity: 24,
    },
    {
      name: "Big Foil",
      categoryId: packaging.id,
      unit: "ROLL" as const,
      minimumQuantity: 5,
      quantity: 8,
    },
    {
      name: "Small Foil",
      categoryId: packaging.id,
      unit: "ROLL" as const,
      minimumQuantity: 10,
      quantity: 15,
    },
    {
      name: "Bags",
      categoryId: packaging.id,
      unit: "PACK" as const,
      minimumQuantity: 5,
      quantity: 12,
    },
    {
      name: "Box S",
      categoryId: boxes.id,
      unit: "PCS" as const,
      minimumQuantity: 50,
      quantity: 120,
    },
    {
      name: "Box M",
      categoryId: boxes.id,
      unit: "PCS" as const,
      minimumQuantity: 50,
      quantity: 80,
    },
    {
      name: "Box L",
      categoryId: boxes.id,
      unit: "PCS" as const,
      minimumQuantity: 30,
      quantity: 45,
    },
    {
      name: "Labels",
      categoryId: labels.id,
      unit: "PACK" as const,
      minimumQuantity: 10,
      quantity: 25,
    },
    {
      name: "Gloves",
      categoryId: safety.id,
      unit: "PACK" as const,
      minimumQuantity: 5,
      quantity: 20,
    },
  ];

  for (const materialData of materials) {
    const material = await prisma.material.upsert({
      where: {
        categoryId_name: {
          categoryId: materialData.categoryId,
          name: materialData.name,
        },
      },
      update: {
        unit: materialData.unit,
        minimumQuantity: materialData.minimumQuantity,
        isActive: true,
      },
      create: {
        name: materialData.name,
        categoryId: materialData.categoryId,
        unit: materialData.unit,
        minimumQuantity: materialData.minimumQuantity,
        isActive: true,
      },
    });

    await prisma.inventory.upsert({
      where: {
        materialId: material.id,
      },
      update: {},
      create: {
        materialId: material.id,
        quantity: materialData.quantity,
        version: 1,
      },
    });
  }

  console.log("Seed completed successfully.");

  console.log({
    admin: {
      id: admin.id,
      username: admin.username,
    },
    worker: {
      id: worker.id,
      username: worker.username,
    },
    roles: {
      worker: workerRole.id,
      admin: adminRole.id,
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });