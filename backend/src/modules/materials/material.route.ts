import type { FastifyInstance } from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import { PERMISSIONS } from "../auth/permissions.js";

import { getMaterials } from "./material.controller.js";

export async function materialRoutes(
  app: FastifyInstance,
) {
  await app.register(async (protectedRoutes) => {
    await protectedRoutes.register(authenticate);

    await protectedRoutes.register(
      authorize(PERMISSIONS.INVENTORY_READ),
    );

    protectedRoutes.get(
      "/materials",
      getMaterials,
    );
  });
}