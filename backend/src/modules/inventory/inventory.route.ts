import type { FastifyInstance } from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import { PERMISSIONS } from "../auth/permissions.js";

import {
  decrementInventoryController,
  getInventoryController,
  incrementInventoryController,
  setInventoryController,
} from "./inventory.controller.js";

export async function inventoryRoutes(
  app: FastifyInstance,
) {
  await app.register(async (protectedRoutes) => {
    await protectedRoutes.register(authenticate);

    await protectedRoutes.register(
      authorize(
        PERMISSIONS.INVENTORY_READ,
      ),
    );

    protectedRoutes.get(
      "/inventory",
      getInventoryController,
    );
  });

  await app.register(async (protectedRoutes) => {
    await protectedRoutes.register(authenticate);

    await protectedRoutes.register(
      authorize(
        PERMISSIONS.INVENTORY_UPDATE,
      ),
    );

    protectedRoutes.post(
      "/inventory/:materialId/increment",
      incrementInventoryController,
    );

    protectedRoutes.post(
      "/inventory/:materialId/decrement",
      decrementInventoryController,
    );

    protectedRoutes.put(
      "/inventory/:materialId",
      setInventoryController,
    );
  });
}