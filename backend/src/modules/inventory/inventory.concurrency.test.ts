import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "../../lib/prisma.js";
import { adjustInventory, setInventory } from "./inventory.service.js";

async function createInventoryFixture() {
  const role = await prisma.role.create({
    data: {
      name: "CONCURRENCY_TEST_ROLE",
      description: "Role used by inventory concurrency tests",
    },
  });

  const user = await prisma.user.create({
    data: {
      username: "concurrency-test-user",
      passwordHash: "test-hash",
      roleId: role.id,
      isActive: true,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: "Concurrency Test Category",
      description: "Category used by inventory concurrency tests",
      isActive: true,
    },
  });

  const material = await prisma.material.create({
    data: {
      name: "Concurrency Test Material",
      categoryId: category.id,
      unit: "PCS",
      minimumQuantity: 0,
      isActive: true,
    },
  });

  const inventory = await prisma.inventory.create({
    data: {
      materialId: material.id,
      quantity: 0,
      version: 1,
    },
  });

  return { user, material, inventory };
}

describe("Inventory concurrency", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.inventoryChange.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.material.deleteMany();
    await prisma.category.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  it("serializes concurrent increments without losing updates", async () => {
    const { user, material } = await createInventoryFixture();

    const operations = Array.from({ length: 20 }, () =>
      adjustInventory({
        materialId: material.id,
        userId: user.id,
        amount: 1,
        operation: "INCREMENT",
      }),
    );

    const results = await Promise.all(operations);

    const inventory = await prisma.inventory.findUnique({
      where: { materialId: material.id },
    });

    const changes = await prisma.inventoryChange.findMany({
      where: { materialId: material.id },
    });

    expect(results).toHaveLength(20);
    expect(inventory).toMatchObject({
      quantity: 20,
      version: 21,
    });
    expect(changes).toHaveLength(20);
  });

  it("allows only one concurrent exact update for the same expected version", async () => {
    const { user, material, inventory } = await createInventoryFixture();

    const attempts = await Promise.allSettled([
      setInventory({
        materialId: material.id,
        userId: user.id,
        quantity: 10,
        expectedVersion: inventory.version,
      }),
      setInventory({
        materialId: material.id,
        userId: user.id,
        quantity: 20,
        expectedVersion: inventory.version,
      }),
    ]);

    const fulfilled = attempts.filter(
      (result) => result.status === "fulfilled",
    );
    const rejected = attempts.filter(
      (result) => result.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejection = rejected[0];
    expect(rejection.status).toBe("rejected");
    if (rejection.status === "rejected") {
      expect(rejection.reason).toBeInstanceOf(Error);
      expect(rejection.reason.message).toBe("VERSION_CONFLICT");
    }

    const finalInventory = await prisma.inventory.findUnique({
      where: { materialId: material.id },
    });

    expect([10, 20]).toContain(finalInventory?.quantity);
    expect(finalInventory?.version).toBe(2);

    const changes = await prisma.inventoryChange.findMany({
      where: { materialId: material.id },
    });

    expect(changes).toHaveLength(1);
  });
});
