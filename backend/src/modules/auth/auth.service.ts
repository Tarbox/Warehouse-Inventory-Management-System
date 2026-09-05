import argon2 from "argon2";

import { prisma } from "../../lib/prisma.js";
import { generateSessionId } from "./session.js";
import type {
  AuthenticatedUser,
} from "./auth.types.js";

async function getSessionDurationHours() {
  const setting =
    await prisma.systemSetting.findUnique({
      where: {
        key: "session_duration_hours",
      },
    });

  if (!setting) {
    return 8;
  }

  const hours =
    Number(setting.value);

  if (
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > 168
  ) {
    return 8;
  }

  return hours;
}

// Returns a session ID and a sanitized user object on success
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

  const sessionDurationHours =
  await getSessionDurationHours();

const sessionDurationMs =
  sessionDurationHours *
  60 *
  60 *
  1000;

  const sessionId = generateSessionId();

  const expiresAt = new Date(
  Date.now() +
    sessionDurationMs,
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
    expiresAt,
    user: sanitizeUser(user),
  };
}

// Removes the server-side session associated with the given session ID
export async function logout(sessionId: string) {
  await prisma.session.deleteMany({
    where: {
      id: sessionId,
    },
  });
}

// Resolves a session ID to an active authenticated user
// Expired sessions are removed and invalid sessions return null
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

// Creates a safe user object for returning to the client
//without exposing sensitive fields such as passwordHash
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