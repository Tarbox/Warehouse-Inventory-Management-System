import type { Prisma } from "../../generated/prisma/client/client.js";

export type AuthenticatedUser = Prisma.UserGetPayload<{
  include: {
    role: true;
  };
}>;