import type { FastifyInstance } from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import { PERMISSIONS } from "../auth/permissions.js";

import {
  getHistoryController,
} from "./history.controller.js";

// The function registers the history routes with the Fastify instance.
export async function historyRoutes(
  app: FastifyInstance,
) {// Register protected routes for retrieving inventory change history records.
  await app.register(
    async (protectedRoutes) => {
// Authenticate the user before allowing access to the route.
      await protectedRoutes.register(
        authenticate,
      );
// Check whether the authenticated user has permission to read inventory change history records.
      await protectedRoutes.register(
        authorize(
          PERMISSIONS.HISTORY_READ,
        ),
      );
// Register the GET /history route, which retrieves inventory change history records based on query parameters.
      protectedRoutes.get(
        "/history",
        getHistoryController,
      );
    },
  );
}