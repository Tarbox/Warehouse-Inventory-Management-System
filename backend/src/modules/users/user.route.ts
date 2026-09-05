import type {
  FastifyInstance,
} from "fastify";

import authenticate from "../../plugins/authenticate.js";
import { authorize } from "../../plugins/authorize.js";

import {
  PERMISSIONS,
} from "../auth/permissions.js";

import {
  changeUserRoleController,
  createUserController,
  deleteUserController,
  disableUserController,
  getUsersController,
  resetPasswordController,
} from "./user.controller.js";

export async function userRoutes(
  app: FastifyInstance,
) {
  await app.register(
    async (protectedRoutes) => {
      await protectedRoutes.register(
        authenticate,
      );

      await protectedRoutes.register(
        authorize(
          PERMISSIONS.USERS_MANAGE,
        ),
      );

      protectedRoutes.get(
        "/users",
        getUsersController,
      );

      protectedRoutes.post(
        "/users",
        createUserController,
      );

      protectedRoutes.patch(
        "/users/:id/role",
        changeUserRoleController,
      );

      protectedRoutes.post(
        "/users/:id/reset-password",
        resetPasswordController,
      );

      protectedRoutes.delete(
        "/users/:id",
        deleteUserController,
      );

      protectedRoutes.post(
        "/users/:id/disable",
        disableUserController,
      );
    },
  );
}