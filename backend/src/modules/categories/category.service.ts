import { prisma } from "../../lib/prisma.js";
import {
  broadcast,
} from "../realtime/realtime.manager.js"

type CreateCategoryInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};

export async function listCategories() {
  return prisma.category.findMany({
  where: {
    isActive: true,
  },

  orderBy: {
    name: "asc",
  },

  select: {
    id: true,
    name: true,
    description: true,
    imageUrl: true,
  },
});
}

export async function createCategory(
  input: CreateCategoryInput,
) {
  const existing =
    await prisma.category.findUnique({
      where: {
        name: input.name,
      },
    });

  if (existing) {
    throw new Error(
      "CATEGORY_ALREADY_EXISTS",
    );
  }

  const result =
    await prisma.category.create({
      data: {
        name: input.name,
        description:
          input.description ?? null,
      },

      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
      },
    });

  broadcast({
    type: "category.created",
    payload: {
      categoryId: result.id,
    },
  });

  return result;
}

export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
) {
  const category =
    await prisma.category.findUnique({
      where: {
        id,
      },
    });

  if (!category) {
    throw new Error(
      "CATEGORY_NOT_FOUND",
    );
  }

  if (input.name) {
    const existing =
      await prisma.category.findFirst({
        where: {
          name: input.name,
          id: {
            not: id,
          },
        },
      });

    if (existing) {
      throw new Error(
        "CATEGORY_ALREADY_EXISTS",
      );
    }
  }

  const result = await prisma.category.update({
  where: {
    id,
  },

  data: {
    ...input,
  },

  select: {
    id: true,
    name: true,
    description: true,
    imageUrl: true,
  },
});

broadcast({
  type: "category.updated",
  payload: {
    categoryId: result.id,
  },
});

return result;
}

export async function deleteCategory(
  id: number,
) {
  const category =
    await prisma.category.findUnique({
      where: {
        id,
      },
    });

  if (!category) {
    throw new Error(
      "CATEGORY_NOT_FOUND",
    );
  }

  const materialCount =
  await prisma.material.count({
    where: {
      categoryId: id,
      isActive: true,
    },
  });

if (materialCount > 0) {
  throw new Error(
    "CATEGORY_IN_USE",
  );
}

await prisma.category.update({
  where: {
    id,
  },

  data: {
    isActive: false,
  },
});

  broadcast({
    type: "category.deleted",
    payload: {
      categoryId: id,
    },
  });
}