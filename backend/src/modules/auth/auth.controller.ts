import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./auth.constants.js";

import { loginSchema } from "./auth.schema.js";

import {
  getCurrentUser,
  login,
  logout,
} from "./auth.service.js";

// Handles user login:
// validates credentials, creates a server-side session,
// and stores the session ID in an HttpOnly cookie.
export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Invalid username or password",
      details: parsed.error.flatten(),
    });
  }

  const result = await login(
    parsed.data.username,
    parsed.data.password,
  );

  if (!result) {
    return reply.status(401).send({
      error: "INVALID_CREDENTIALS",
      message: "Invalid username or password",
    });
  }

reply.setCookie(
  SESSION_COOKIE_NAME,
  result.sessionId,
  {
    ...SESSION_COOKIE_OPTIONS,

    maxAge: Math.max(
      0,
      Math.floor(
        (
          result.expiresAt.getTime() -
          Date.now()
        ) / 1000,
      ),
    ),
  },
);

  return reply.send({
    user: result.user,
  });
}

// Handles logout by deleting the server-side session
// and clearing the session cookie.
export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId =
    request.cookies[SESSION_COOKIE_NAME];

  if (sessionId) {
    await logout(sessionId);
  }

  reply.clearCookie(
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
  );

  return reply.send({
    success: true,
  });
}

// Returns the currently authenticated user based on
// the server-side session stored in the session cookie.
export async function meController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId =
    request.cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    return reply.status(401).send({
      error: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }

  const user = await getCurrentUser(sessionId);

  if (!user) {
    reply.clearCookie(
      SESSION_COOKIE_NAME,
      SESSION_COOKIE_OPTIONS,
    );

    return reply.status(401).send({
      error: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }

  return reply.send({
    user: {
      id: user.id,
      username: user.username,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    },
  });
}