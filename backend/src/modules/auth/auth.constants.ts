export const SESSION_COOKIE_NAME = "warehouse_session";

export const SESSION_COOKIE_OPTIONS = {

  // Prevents client-side JavaScript from reading the session ID.
  httpOnly: true,

  // Require HTTPS in production, but allow HTTP for local development.
  secure: process.env.NODE_ENV === "production",

  // Restricts the cookie in cross-site request scenarios.
  sameSite: "lax" as const,
  path: "/",
};