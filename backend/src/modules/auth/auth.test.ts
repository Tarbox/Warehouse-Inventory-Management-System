import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import argon2 from "argon2";
import { SESSION_COOKIE_NAME } from "./auth.constants.js";

import { buildApp } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { generateSessionId } from "./session.js";

async function createAuthenticatedUser(
  roleName: "WORKER" | "ADMIN",
) {
  const role = await prisma.role.create({
    data: {
      name: roleName,
      description: `Role used by ${roleName} authorization tests`,
    },
  });

  const user = await prisma.user.create({
    data: {
      username: `${roleName.toLowerCase()}-authz-user`,
      passwordHash: "test-hash",
      isActive: true,
      roleId: role.id,
    },
  });

  const sessionId = generateSessionId();

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + 60 * 60 * 1000,
      ),
    },
  });

  return {
    user,
    sessionId,
    cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
  };
}
describe("Authentication", () => {
  let app: Awaited<
    ReturnType<typeof buildApp>
  >;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
});

  it("should login successfully", async () => {
  const password = "TestPassword123!";

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  

  

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username: "testuser",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: user.username,
      password,
    },
  });

  expect(response.statusCode).toBe(200);

  const body = response.json();

  expect(body.user).toMatchObject({
    id: user.id,
    username: "testuser",
    isActive: true,
    role: {
      id: role.id,
      name: "TEST_USER",
    },
  });

  expect(body.user.passwordHash).toBeUndefined();

  const setCookie = response.headers["set-cookie"];

  expect(setCookie).toBeDefined();

  const cookieHeader = Array.isArray(setCookie)
    ? setCookie[0]
    : setCookie;

  expect(cookieHeader).toContain(
    `${SESSION_COOKIE_NAME}=`,
  );

  const sessionId =
    cookieHeader
      ?.split(";")[0]
      .split("=")[1];

  expect(sessionId).toBeTruthy();

  const session =
    await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

  expect(session).not.toBeNull();

  expect(session?.userId).toBe(user.id);
  expect(session?.expiresAt.getTime())
    .toBeGreaterThan(Date.now());
});

it("should reject login with wrong password", async () => {
  const correctPassword = "TestPassword123!";
  const wrongPassword = "WrongPassword123!";

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(
    correctPassword,
  );

  const user = await prisma.user.create({
    data: {
      username: "testuser",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: user.username,
      password: wrongPassword,
    },
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "INVALID_CREDENTIALS",
    message: "Invalid username or password",
  });

  const session =
    await prisma.session.findFirst({
      where: {
        userId: user.id,
      },
    });

  expect(session).toBeNull();

  const setCookie =
    response.headers["set-cookie"];

  expect(setCookie).toBeUndefined();
});

it("should reject /auth/me without a session cookie", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/auth/me",
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });
});

it("should reject /auth/me with an invalid session cookie", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=invalid-session-id`,
    },
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });
});

it("should return the current user with a valid session", async () => {
  const password = "TestPassword123!";

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username: "me-test-user",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: user.username,
      password,
    },
  });

  expect(loginResponse.statusCode).toBe(200);

  const setCookie = loginResponse.headers["set-cookie"];

  expect(setCookie).toBeDefined();

  const cookieHeader = Array.isArray(setCookie)
    ? setCookie[0]
    : setCookie;

  const sessionCookie =
    cookieHeader?.split(";")[0];

  expect(sessionCookie).toContain(
    `${SESSION_COOKIE_NAME}=`,
  );

  const meResponse = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: {
      cookie: sessionCookie,
    },
  });

  expect(meResponse.statusCode).toBe(200);

  expect(meResponse.json()).toMatchObject({
    user: {
      id: user.id,
      username: user.username,
      isActive: true,
      role: {
        id: role.id,
        name: "TEST_USER",
      },
    },
  });
});

it("should logout successfully and invalidate the session", async () => {
  const password = "TestPassword123!";

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username: "logout-test-user",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: user.username,
      password,
    },
  });

  expect(loginResponse.statusCode).toBe(200);

  const setCookie = loginResponse.headers["set-cookie"];

  expect(setCookie).toBeDefined();

  const cookieHeader = Array.isArray(setCookie)
    ? setCookie[0]
    : setCookie;

  const sessionCookie =
    cookieHeader?.split(";")[0];

  expect(sessionCookie).toContain(
    `${SESSION_COOKIE_NAME}=`,
  );

  const sessionId =
    sessionCookie
      ?.split("=")
      .slice(1)
      .join("=");

  expect(sessionId).toBeTruthy();

  const sessionBeforeLogout =
    await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

  expect(sessionBeforeLogout).not.toBeNull();

  const logoutResponse = await app.inject({
    method: "POST",
    url: "/api/auth/logout",
    headers: {
      cookie: sessionCookie,
    },
  });

  expect(logoutResponse.statusCode).toBe(200);

  expect(logoutResponse.json()).toEqual({
    success: true,
  });

  const sessionAfterLogout =
    await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

  expect(sessionAfterLogout).toBeNull();

  const clearCookie =
    logoutResponse.headers["set-cookie"];

  expect(clearCookie).toBeDefined();

  const clearCookieHeader = Array.isArray(
    clearCookie,
  )
    ? clearCookie[0]
    : clearCookie;

  expect(clearCookieHeader).toContain(
    `${SESSION_COOKIE_NAME}=`,
  );

  expect(clearCookieHeader).toMatch(
    /Max-Age=0/i,
  );

  const meResponse = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: {
      cookie: sessionCookie,
    },
  });

  expect(meResponse.statusCode).toBe(401);

  expect(meResponse.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });
});
it("should reject and remove an expired session", async () => {
  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(
    "TestPassword123!",
  );

  const user = await prisma.user.create({
    data: {
      username: "expired-session-user",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const sessionId = "expired-test-session";

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(
        Date.now() - 60_000,
      ),
    },
  });

  const sessionBefore =
    await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

  expect(sessionBefore).not.toBeNull();

  const response = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
    },
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });

  const sessionAfter =
    await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

  expect(sessionAfter).toBeNull();

  const setCookie =
    response.headers["set-cookie"];

  expect(setCookie).toBeDefined();

  const cookieHeader = Array.isArray(setCookie)
    ? setCookie[0]
    : setCookie;

  expect(cookieHeader).toMatch(
    /Max-Age=0/i,
  );
});
it("should reject login for a disabled user", async () => {
  const password = "TestPassword123!";

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username: "disabled-test-user",
      passwordHash,
      isActive: false,
      roleId: role.id,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      username: user.username,
      password,
    },
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "INVALID_CREDENTIALS",
    message: "Invalid username or password",
  });

  const session =
    await prisma.session.findFirst({
      where: {
        userId: user.id,
      },
    });

  expect(session).toBeNull();

  expect(
    response.headers["set-cookie"],
  ).toBeUndefined();
});

it("should apply dynamic session duration", async () => {
  const password = "TestPassword123!";
  const sessionDurationHours = 2;

  const role = await prisma.role.create({
    data: {
      name: "TEST_USER",
      description: "Role used by authentication tests",
    },
  });

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username: "dynamic-session-user",
      passwordHash,
      isActive: true,
      roleId: role.id,
    },
  });

  const originalSetting =
    await prisma.systemSetting.findUnique({
      where: {
        key: "session_duration_hours",
      },
    });

  await prisma.systemSetting.upsert({
    where: {
      key: "session_duration_hours",
    },
    update: {
      value: String(sessionDurationHours),
    },
    create: {
      key: "session_duration_hours",
      value: String(sessionDurationHours),
    },
  });

  try {
    const startedAt = Date.now();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        username: user.username,
        password,
      },
    });

    expect(response.statusCode).toBe(200);

    const session =
      await prisma.session.findFirst({
        where: {
          userId: user.id,
        },
      });

    expect(session).not.toBeNull();

    const expectedDurationMs =
      sessionDurationHours *
      60 *
      60 *
      1000;

    const actualDurationMs =
      session!.expiresAt.getTime() -
      startedAt;

    expect(
      actualDurationMs,
    ).toBeGreaterThan(
      expectedDurationMs - 5000,
    );

    expect(
      actualDurationMs,
    ).toBeLessThan(
      expectedDurationMs + 5000,
    );
  } finally {
    if (originalSetting) {
      await prisma.systemSetting.upsert({
        where: {
          key: originalSetting.key,
        },
        update: {
          value: originalSetting.value,
        },
        create: {
          key: originalSetting.key,
          value: originalSetting.value,
        },
      });
    } else {
      await prisma.systemSetting.delete({
        where: {
          key: "session_duration_hours",
        },
      });
    }
  }
});

it("should return 401 for unauthenticated requests", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/inventory",
  });

  expect(response.statusCode).toBe(401);

  expect(response.json()).toMatchObject({
    error: "UNAUTHENTICATED",
    message: "Authentication required",
  });
});

it("should allow WORKER to read inventory", async () => {
  const { cookie } =
    await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "GET",
    url: "/api/inventory",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(200);
});

it("should allow WORKER to use inventory update operations", async () => {
  const { cookie } =
    await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "POST",
    url: "/api/inventory/999999/increment",
    headers: {
      cookie,
    },
    payload: {
      amount: 1,
    },
  });

  expect(response.statusCode).toBe(404);
});

it("should return 403 for WORKER on users endpoint", async () => {
  const { cookie } =
    await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "GET",
    url: "/api/users",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(403);

  expect(response.json()).toMatchObject({
    error: "FORBIDDEN",
  });
});

it("should return 403 for WORKER on settings endpoint", async () => {
  const { cookie } =
    await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "GET",
    url: "/api/settings",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(403);

  expect(response.json()).toMatchObject({
    error: "FORBIDDEN",
  });
});

it("should allow ADMIN to access users endpoint", async () => {
  const { cookie } =
    await createAuthenticatedUser("ADMIN");

  const response = await app.inject({
    method: "GET",
    url: "/api/users",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(200);
});

it("should allow WORKER to read categories", async () => {
  const { cookie } = await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "GET",
    url: "/api/categories",
    headers: { cookie },
  });

  expect(response.statusCode).toBe(200);
});

it("should return 403 for WORKER on category management", async () => {
  const { cookie } = await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "POST",
    url: "/api/categories",
    headers: { cookie },
    payload: {
      name: "Forbidden Worker Category",
    },
  });

  expect(response.statusCode).toBe(403);
  expect(response.json()).toMatchObject({ error: "FORBIDDEN" });
});

it("should return 403 for WORKER on history endpoint", async () => {
  const { cookie } = await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "GET",
    url: "/api/history",
    headers: { cookie },
  });

  expect(response.statusCode).toBe(403);
  expect(response.json()).toMatchObject({ error: "FORBIDDEN" });
});

it("should allow ADMIN to access history endpoint", async () => {
  const { cookie } = await createAuthenticatedUser("ADMIN");

  const response = await app.inject({
    method: "GET",
    url: "/api/history",
    headers: { cookie },
  });

  expect(response.statusCode).toBe(200);
});

it("should return 403 for WORKER on settings update", async () => {
  const { cookie } = await createAuthenticatedUser("WORKER");

  const response = await app.inject({
    method: "PATCH",
    url: "/api/settings/session_duration_hours",
    headers: { cookie },
    payload: { value: "4" },
  });

  expect(response.statusCode).toBe(403);
  expect(response.json()).toMatchObject({ error: "FORBIDDEN" });
});

it("should allow ADMIN to access settings endpoint", async () => {
  const { cookie } =
    await createAuthenticatedUser("ADMIN");

  const response = await app.inject({
    method: "GET",
    url: "/api/settings",
    headers: {
      cookie,
    },
  });

  expect(response.statusCode).toBe(200);
});
});

