import type {
  FastifyInstance,
} from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import {
  PERMISSIONS,
} from "../auth/permissions.js";

import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  updateCategoryController,
} from "./category.controller.js";

export async function categoryRoutes(
  app: FastifyInstance,
) {
  // Routes available to authenticated users who can read inventory.
  await app.register(
    async (protectedRoutes) => {
      await protectedRoutes.register(
        authenticate,
      );

      await protectedRoutes.register(
        authorize(
          PERMISSIONS.INVENTORY_READ,
        ),
      );

      protectedRoutes.get(
        "/categories",
        getCategoriesController,
      );
    },
  );

  // Routes available to administrators who can manage materials.
  await app.register(
    async (adminRoutes) => {
      await adminRoutes.register(
        authenticate,
      );

      await adminRoutes.register(
        authorize(
          PERMISSIONS.MATERIALS_MANAGE,
        ),
      );

      // Create a new category.
      adminRoutes.post(
        "/categories",
        createCategoryController,
      );

      // Update an existing category.
      adminRoutes.patch(
        "/categories/:id",
        updateCategoryController,
      );

      // Delete an unused category.
      adminRoutes.delete(
        "/categories/:id",
        deleteCategoryController,
      );
    },
  );
}