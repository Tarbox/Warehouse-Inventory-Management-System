import fp from "fastify-plugin";

import type { Permission } from "../modules/auth/permissions.js";
import { ROLE_PERMISSIONS } from "../modules/auth/role-permissions.js";

export function hasPermission(
  roleName: string,
  permission: Permission,
): boolean {
  const permissions =
    ROLE_PERMISSIONS[roleName];

  if (!permissions) {
    return false;
  }

  return permissions.includes(permission);
}

export function authorize(
  permission: Permission,
) {
  return fp(async (app) => {
    app.addHook(
      "preHandler",
      async (request, reply) => {
        if (!request.user) {
          return reply.status(401).send({
            error: "UNAUTHENTICATED",
            message: "Authentication required",
          });
        }

        const allowed = hasPermission(
          request.user.role.name,
          permission,
        );

        if (!allowed) {
          return reply.status(403).send({
            error: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
        }
      },
    );
  });
}