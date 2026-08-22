import argon2 from "argon2";

import { prisma } from "../../lib/prisma.js";
import { generateSessionId } from "./session.js";
import type {
  AuthenticatedUser,
} from "./auth.types.js";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export async function login(
  username: string,
  password: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    include: {
      role: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    password,
  );

  if (!passwordValid) {
    return null;
  }

  const sessionId = generateSessionId();

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS,
  );

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    sessionId,
    user: sanitizeUser(user),
  };
}

export async function logout(sessionId: string) {
  await prisma.session.deleteMany({
    where: {
      id: sessionId,
    },
  });
}

export async function getCurrentUser(
  sessionId: string,
): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return session.user;
}

function sanitizeUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    role: {
      id: user.role.id,
      name: user.role.name,
    },
  };
}