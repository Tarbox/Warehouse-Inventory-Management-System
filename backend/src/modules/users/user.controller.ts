import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

// Import the necessary schemas and service functions for user management.
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from "./user.schema.js";

// Import the service functions that handle the business logic for user operations.
import {
  changeUserRole,
  createUser,
  deleteUser,
  disableUser,
  listUsers,
  resetUserPassword,
} from "./user.service.js";

// The getUsersController function handles the HTTP request to retrieve a list of users.
export async function getUsersController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const users =
    await listUsers();

// Send the list of users back to the client as the HTTP response.
  return reply.send({
    items: users,
  });
}

// The createUserController function handles the HTTP request to create a new user.
// It validates the request body against the createUserSchema and calls the createUser service function.
export async function createUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body =
    createUserSchema.safeParse(
      request.body,
    );

  if (!body.success) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message:
        "Invalid user data",
      details:
        body.error.flatten(),
    });
  }

// Attempt to create the user and handle any errors that may occur during the process.
// If the role does not exist or the username is already taken, return appropriate HTTP error responses.
// If the user is created successfully, return a 201 Created response with the user data.
  try {
    const user =
      await createUser(
        body.data,
      );

    return reply.status(201).send({
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "ROLE_NOT_FOUND"
    ) {
      return reply.status(400).send({
        error:
          "ROLE_NOT_FOUND",
        message:
          "Role does not exist",
      });
    }

// If the username already exists, return a 409 Conflict response with an appropriate error message.
    if (
      error instanceof Error &&
      error.message ===
        "USERNAME_ALREADY_EXISTS"
    ) {
      return reply.status(409).send({
        error:
          "USERNAME_ALREADY_EXISTS",
        message:
          "Username already exists",
      });
    }

    throw error;
  }
}

// The disableUserController function handles the HTTP request to disable a user account.
export async function disableUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    userIdParamSchema.safeParse(
      request.params,
    );

  if (!params.success) {
    return reply.status(400).send({
      error:
        "VALIDATION_ERROR",
      message:
        "Invalid user ID",
    });
  }

// Attempt to disable the user and handle any errors that may occur during the process.
// If the user does not exist or if the current user is trying to disable their own account, return appropriate HTTP error responses.
// If the user is disabled successfully, return a 204 No Content response.
  try {
    await disableUser(
      params.data.id,
      request.user!.id,
    );

    return reply.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "USER_NOT_FOUND",
        message:
          "User not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CANNOT_DISABLE_SELF"
    ) {
      return reply.status(409).send({
        error:
          "CANNOT_DISABLE_SELF",
        message:
          "You cannot disable your own account",
      });
    }

    throw error;
  }
}

// The changeUserRoleController function handles the HTTP request to change a user's role.
export async function changeUserRoleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    userIdParamSchema.safeParse(
      request.params,
    );

  const body =
    updateUserRoleSchema.safeParse(
      request.body,
    );

  if (
    !params.success ||
    !body.success
  ) {
    return reply.status(400).send({
      error:
        "VALIDATION_ERROR",
      message:
        "Invalid role data",
    });
  }

// Attempt to change the user's role and handle any errors that may occur during the process.
// If the user or role does not exist, return appropriate HTTP error responses.
// If the role is changed successfully, return the updated user data in the response.
  try {
    const user =
      await changeUserRole(
        params.data.id,
        body.data.roleId,
        request.user!.id,
      );

    return reply.send({
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "USER_NOT_FOUND",
        message:
          "User not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "ROLE_NOT_FOUND"
    ) {
      return reply.status(400).send({
        error:
          "ROLE_NOT_FOUND",
        message:
          "Role does not exist",
      });
    }

    throw error;
  }
}

// The resetPasswordController function handles the HTTP request to reset a user's password.
// It validates the request parameters and body against the userIdParamSchema and resetPasswordSchema, respectively.
export async function resetPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    userIdParamSchema.safeParse(
      request.params,
    );

  const body =
    resetPasswordSchema.safeParse(
      request.body,
    );

  if (
    !params.success ||
    !body.success
  ) {
    return reply.status(400).send({
      error:
        "VALIDATION_ERROR",
      message:
        "Invalid password data",
    });
  }

// Attempt to reset the user's password and handle any errors that may occur during the process.
// If the user does not exist, return a 404 Not Found response with an appropriate error message.
  try {
    await resetUserPassword(
      params.data.id,
      body.data.password,
    );

    return reply.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "USER_NOT_FOUND",
        message:
          "User not found",
      });
    }

    throw error;
  }
}

// The deleteUserController function handles the HTTP request to delete a user account.
// It validates the request parameters against the userIdParamSchema and calls the deleteUser service function.
export async function deleteUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    userIdParamSchema.safeParse(
      request.params,
    );

  if (!params.success) {
    return reply.status(400).send({
      error:
        "VALIDATION_ERROR",
      message:
        "Invalid user ID",
    });
  }

// Attempt to delete the user and handle any errors that may occur during the process.
// If the user does not exist, if the current user is trying to delete their own account, or if the user has audit history, return appropriate HTTP error responses.
// If the user is deleted successfully, return a 204 No Content response.
  try {
    await deleteUser(
      params.data.id,
      request.user!.id,
    );

    return reply.status(204).send();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "USER_NOT_FOUND"
    ) {
      return reply.status(404).send({
        error:
          "USER_NOT_FOUND",
        message:
          "User not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CANNOT_DELETE_SELF"
    ) {
      return reply.status(409).send({
        error:
          "CANNOT_DELETE_SELF",
        message:
          "You cannot delete your own account",
      });
    }

// If the user has audit history, return a 409 Conflict response with an appropriate error message.
    if (
      error instanceof Error &&
      error.message ===
        "USER_HAS_HISTORY"
    ) {
      return reply.status(409).send({
        error:
          "USER_HAS_HISTORY",
        message:
          "User cannot be deleted because audit history exists. Disable the account instead.",
      });
    }

    throw error;
  }
}