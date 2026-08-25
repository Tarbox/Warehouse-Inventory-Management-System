// Prisma is imported only for its generated TypeScript types
import type { Prisma } from "../../generated/prisma/client/client.js";

// Represents an authenticated user together with the user's role.
// The shape matches a Prisma User payload with the `role` relation included
export type AuthenticatedUser = Prisma.UserGetPayload<{
  include: {
    role: true;
  };
}>;