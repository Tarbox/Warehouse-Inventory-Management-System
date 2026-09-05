import argon2 from "argon2";

import {
  Prisma,
} from "../../generated/prisma/client/client.js";

import { prisma } from "../../lib/prisma.js";


import {
  toUserDto,
} from "./user.dto.js";

// listUsers retrieves all users from the database, including their associated roles, and returns them as an array of user DTOs.
export async function listUsers() {
  const users =
    await prisma.user.findMany({
      include: {
        role: true,
      },

      orderBy: {
        username: "asc",
      },
    });
// Map the retrieved users to the UserDto type and return the result.
  return users.map(toUserDto);
}

// createUser creates a new user in the database with the provided username, password, and role ID. It hashes the password using argon2 and returns the created user as a user DTO.
export async function createUser(
  input: {
    username: string;
    password: string;
    roleId: number;
  },
) {
  const role =
    await prisma.role.findUnique({
      where: {
        id: input.roleId,
      },
    });

  if (!role) {
    throw new Error(
      "ROLE_NOT_FOUND",
    );
  }

  const passwordHash =
    await argon2.hash(
      input.password,
      {
        type: argon2.argon2id,
      },
    );

  try {
    const user =
      await prisma.user.create({
        data: {
          username: input.username,

          passwordHash,

          roleId: input.roleId,

          isActive: true,
        },

        include: {
          role: true,
        },
      });

    return toUserDto(user);
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(
        "USERNAME_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

// disableUser disables a user by setting their isActive field to false and deleting all their active sessions. 
// It throws an error if the user tries to disable themselves or if the user is not found.
export async function disableUser(
  userId: number,
  currentUserId: number,
) {
  if (userId === currentUserId) {
    throw new Error(
      "CANNOT_DISABLE_SELF",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        isActive: false,
      },
    }),

    prisma.session.deleteMany({
      where: {
        userId,
      },
    }),
  ]);
}

// enableUser enables a user by setting their isActive field to true.
// It throws an error if the user is not found.
export async function enableUser(
  userId: number,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      isActive: true,
    },

    include: {
      role: true,
    },
  });
}

export async function changeUserRole(
  userId: number,
  roleId: number,
  currentUserId: number,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

  const role =
    await prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

  if (!role) {
    throw new Error(
      "ROLE_NOT_FOUND",
    );
    }

// update the user's role and delete all their active sessions in a transaction to ensure data consistency.
  const updated =
    await prisma.$transaction(
      async (tx) => {
        const result =
          await tx.user.update({
            where: {
              id: userId,
            },

            data: {
              roleId,
            },

            include: {
              role: true,
            },
          });

        await tx.session.deleteMany({
          where: {
            userId,
          },
        });

        return result;
      },
    );

  return toUserDto(updated);
}

// resetUserPassword resets a user's password by hashing the new password and updating the user's passwordHash field in the database.
// It also deletes all active sessions for the user to ensure that they are logged out after the password change.
export async function resetUserPassword(
  userId: number,
  newPassword: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

// Hash the new password using argon2 with the argon2id variant for security.
  const passwordHash =
    await argon2.hash(
      newPassword,
      {
        type: argon2.argon2id,
      },
    );

// Use a transaction to update the user's password and delete all their active sessions to ensure that they are logged out after the password change.
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        passwordHash,
      },
    }),

    prisma.session.deleteMany({
      where: {
        userId,
      },
    }),
  ]);
}

// deleteUser deletes a user from the database after performing several checks:
// 1. It checks if the user is trying to delete themselves and throws an error if so.
// 2. It checks if the user exists in the database and throws an error if not.
// 3. It checks if the user has any inventory change history and throws an error if they do, preventing deletion.
export async function deleteUser(
  userId: number,
  currentUserId: number,
) {
  if (userId === currentUserId) {
    throw new Error(
      "CANNOT_DELETE_SELF",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

  const historyCount =
    await prisma.inventoryChange.count({
      where: {
        userId,
      },
    });

  if (historyCount > 0) {
    throw new Error(
      "USER_HAS_HISTORY",
    );
  }

// If all checks pass, delete the user from the database.
  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
}