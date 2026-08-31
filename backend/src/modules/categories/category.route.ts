import type {
  FastifyInstance,
} from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import {
  PERMISSIONS,
} from "../auth/permissions.js";

import {
  getCategoriesController,
} from "./category.controller.js";

export async function categoryRoutes(
  app: FastifyInstance,
) {
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
}