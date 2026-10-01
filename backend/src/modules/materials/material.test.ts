import argon2 from "argon2";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { buildApp } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { generateSessionId } from "../auth/session.js";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants.js";

async function createAuthenticatedAdmin() {
  const role = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Role used by materials tests",
    },
  });

  const user = await prisma.user.create({
    data: {
      username: "materials-admin",
      passwordHash: "test-hash",
      isActive: true,
      roleId: role.id,
    },
  });

  const sessionId = generateSessionId();

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + 60 * 60 * 1000,
      ),
    },
  });

  return {
    cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
  };
}
async function createAuthenticatedWorker() {
    
  const role = await prisma.role.create({
    data: {
      name: "WORKER",
      description: "Role used by materials tests",
    },
  });

  const user = await prisma.user.create({
    data: {
      username: "materials-worker",
      passwordHash: "test-hash",
      isActive: true,
      roleId: role.id,
    },
  });

  const sessionId = generateSessionId();

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + 60 * 60 * 1000,
      ),
    },
  });

  return {
    cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
  };
}
describe("Materials API", () => {
  let app: Awaited<
    ReturnType<typeof buildApp>
  >;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.material.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  it("should return active materials with pagination", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const category = await prisma.category.create({
    data: {
      name: "Test Category",
      description:
        "Category used by materials tests",
      isActive: true,
    },
  });

  const material = await prisma.material.create({
    data: {
      name: "Test Packing Tape",
      description: "Test material",
      unit: "ROLL",
      minimumQuantity: 5,
      categoryId: category.id,
    },
  });

  await prisma.inventory.create({
    data: {
      materialId: material.id,
      quantity: 12,
      version: 1,
    },
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/materials?page=1&limit=20",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(200);

  const body = response.json();

  expect(body.pagination).toMatchObject({
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  });

  expect(body.items).toHaveLength(1);

  expect(body.items[0]).toMatchObject({
    id: material.id,
    name: "Test Packing Tape",
    description: "Test material",
    unit: "ROLL",
    category: {
      id: category.id,
      name: "Test Category",
    },
    quantity: 12,
    minimumQuantity: 5,
    lowStock: false,
    version: 1,
    isActive: true,
  });
});

it("should return a material by id", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const category = await prisma.category.create({
    data: {
      name: "Material Details Category",
      description: "Category for material details test",
      isActive: true,
    },
  });

  const material = await prisma.material.create({
    data: {
      name: "Detailed Test Material",
      description: "Material details",
      unit: "PCS",
      minimumQuantity: 10,
      categoryId: category.id,
    },
  });

  await prisma.inventory.create({
    data: {
      materialId: material.id,
      quantity: 25,
      version: 1,
    },
  });

  const response = await app.inject({
    method: "GET",
    url: `/api/materials/${material.id}`,
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(200);

  expect(response.json()).toMatchObject({
    material: {
      id: material.id,
      name: "Detailed Test Material",
      description: "Material details",
      unit: "PCS",
      minimumQuantity: 10,
      category: {
        id: category.id,
        name: "Material Details Category",
      },
      inventory: {
        quantity: 25,
        version: 1,
      },
    },
  });
});

it("should return 404 for a non-existent material", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const response = await app.inject({
    method: "GET",
    url: "/api/materials/999999",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(404);

  expect(response.json()).toMatchObject({
    error: "MATERIAL_NOT_FOUND",
    message: "Material not found",
  });
});

it("should create a material with initial inventory", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const category = await prisma.category.create({
    data: {
      name: "Create Material Category",
      description: "Category for create material test",
      isActive: true,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/materials",
    headers: {
      cookie,
    },
    payload: {
      name: "Created Test Material",
      description: "Created by API test",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: category.id,
      initialQuantity: 42,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json();

  expect(body.material).toMatchObject({
    name: "Created Test Material",
    description: "Created by API test",
    unit: "PCS",
    minimumQuantity: 5,
    categoryId: category.id,
  });

  const material =
    await prisma.material.findUnique({
      where: {
        id: body.material.id,
      },
      include: {
        inventory: true,
      },
    });

  expect(material).not.toBeNull();

  expect(material?.name).toBe(
    "Created Test Material",
  );

  expect(material?.inventory?.quantity).toBe(42);
  expect(material?.inventory?.version).toBe(1);
});

it("should return 400 when creating a material with a non-existent category", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const response = await app.inject({
    method: "POST",
    url: "/api/materials",
    headers: {
      cookie,
    },
    payload: {
      name: "Invalid Category Material",
      description: "Should not be created",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: 999999,
      initialQuantity: 10,
    },
  });

  expect(response.statusCode).toBe(400);

  expect(response.json()).toMatchObject({
    error: "CATEGORY_NOT_FOUND",
    message: "Category does not exist",
  });

  const material =
    await prisma.material.findFirst({
      where: {
        name: "Invalid Category Material",
      },
    });

  expect(material).toBeNull();
});

it("should return 409 when creating a duplicate material", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const category = await prisma.category.create({
    data: {
      name: "Duplicate Material Category",
      description:
        "Category for duplicate material test",
      isActive: true,
    },
  });

  await prisma.material.create({
    data: {
      name: "Duplicate Test Material",
      description: "Existing material",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: category.id,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/materials",
    headers: {
      cookie,
    },
    payload: {
      name: "Duplicate Test Material",
      description: "Duplicate material",
      unit: "PCS",
      minimumQuantity: 10,
      categoryId: category.id,
      initialQuantity: 20,
    },
  });

  expect(response.statusCode).toBe(409);

  expect(response.json()).toMatchObject({
    error: "MATERIAL_ALREADY_EXISTS",
    message: "Material already exists",
  });

  const materials =
    await prisma.material.findMany({
      where: {
        categoryId: category.id,
        name: "Duplicate Test Material",
      },
    });

  expect(materials).toHaveLength(1);
});

it("should update a material", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const category = await prisma.category.create({
    data: {
      name: "Update Material Category",
      description: "Category for update test",
      isActive: true,
    },
  });

  const material = await prisma.material.create({
    data: {
      name: "Original Material Name",
      description: "Original description",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: category.id,
    },
  });

  const response = await app.inject({
    method: "PATCH",
    url: `/api/materials/${material.id}`,
    headers: {
      cookie,
    },
    payload: {
      name: "Updated Material Name",
      description: "Updated description",
      unit: "BOX",
      minimumQuantity: 15,
      categoryId: category.id,
    },
  });

  expect(response.statusCode).toBe(200);

  expect(response.json()).toMatchObject({
    material: {
      id: material.id,
      name: "Updated Material Name",
      description: "Updated description",
      unit: "BOX",
      minimumQuantity: 15,
      categoryId: category.id,
    },
  });

  const updated =
    await prisma.material.findUnique({
      where: {
        id: material.id,
      },
    });

  expect(updated).toMatchObject({
    id: material.id,
    name: "Updated Material Name",
    description: "Updated description",
    unit: "BOX",
    minimumQuantity: 15,
    categoryId: category.id,
    isActive: true,
  });
});

it("should return 404 when updating a non-existent material", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const response = await app.inject({
    method: "PATCH",
    url: "/api/materials/999999",
    headers: {
      cookie,
    },
    payload: {
      name: "Updated Material",
      description: "Should not exist",
      unit: "PCS",
      minimumQuantity: 5,
    },
  });

  expect(response.statusCode).toBe(404);

  expect(response.json()).toMatchObject({
    error: "MATERIAL_NOT_FOUND",
    message: "Material not found",
  });
});

it("should return 409 when updating to an existing material name", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const category = await prisma.category.create({
    data: {
      name: "Duplicate Update Category",
      description: "Category for duplicate update test",
      isActive: true,
    },
  });

  const existingMaterial =
    await prisma.material.create({
      data: {
        name: "Existing Material",
        description: "Existing",
        unit: "PCS",
        minimumQuantity: 5,
        categoryId: category.id,
      },
    });

  const materialToUpdate =
    await prisma.material.create({
      data: {
        name: "Another Material",
        description: "Another",
        unit: "PCS",
        minimumQuantity: 5,
        categoryId: category.id,
      },
    });

  const response = await app.inject({
    method: "PATCH",
    url: `/api/materials/${materialToUpdate.id}`,
    headers: {
      cookie,
    },
    payload: {
      name: existingMaterial.name,
    },
  });

  expect(response.statusCode).toBe(409);

  expect(response.json()).toMatchObject({
    error: "MATERIAL_ALREADY_EXISTS",
    message:
      "A material with this name already exists in this category",
  });

  const unchanged =
    await prisma.material.findUnique({
      where: {
        id: materialToUpdate.id,
      },
    });

  expect(unchanged?.name).toBe(
    "Another Material",
  );
});

it("should soft delete a material", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const category = await prisma.category.create({
    data: {
      name: "Delete Material Category",
      description: "Category for delete test",
      isActive: true,
    },
  });

  const material = await prisma.material.create({
    data: {
      name: "Material To Delete",
      description: "Will be disabled",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: category.id,
      isActive: true,
    },
  });

  const response = await app.inject({
    method: "DELETE",
    url: `/api/materials/${material.id}`,
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(204);

  const deleted =
    await prisma.material.findUnique({
      where: {
        id: material.id,
      },
    });

  expect(deleted).not.toBeNull();
  expect(deleted?.isActive).toBe(false);
});

it("should return 404 when deleting a non-existent material", async () => {
  const { cookie } =
    await createAuthenticatedAdmin();

  const response = await app.inject({
    method: "DELETE",
    url: "/api/materials/999999",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(404);

  expect(response.json()).toMatchObject({
    error: "MATERIAL_NOT_FOUND",
    message: "Material not found",
  });
});

it("should return 403 when WORKER creates a material", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const response = await app.inject({
    method: "POST",
    url: "/api/materials",
    headers: {
      cookie,
    },
    payload: {
      name: "Worker Created Material",
      description: "Should not be created",
      unit: "PCS",
      minimumQuantity: 5,
      categoryId: 999999,
      initialQuantity: 10,
    },
  });

  expect(response.statusCode).toBe(403);

  expect(response.json()).toMatchObject({
    error: "FORBIDDEN",
  });
});

it("should return 403 when WORKER updates a material", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const response = await app.inject({
    method: "PATCH",
    url: "/api/materials/999999",
    headers: {
      cookie,
    },
    payload: {
      name: "Worker Updated Material",
    },
  });

  expect(response.statusCode).toBe(403);

  expect(response.json()).toMatchObject({
    error: "FORBIDDEN",
  });
});

it("should return 403 when WORKER deletes a material", async () => {
  const { cookie } =
    await createAuthenticatedWorker();

  const response = await app.inject({
    method: "DELETE",
    url: "/api/materials/999999",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(403);

  expect(response.json()).toMatchObject({
    error: "FORBIDDEN",
  });
});

it("should return 401 for unauthenticated materials request", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/materials",
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });
});
});