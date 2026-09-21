"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  changeUserRole,
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  getUsers,
  resetUserPassword,
  type AdminUser,
} from "../../../lib/api";

import {
  getUserFriendlyErrorMessage,
} from "../../../lib/apiError";

import { useRouter } from "next/navigation";

// The AdminUsersPage component is responsible for managing users in the admin panel.
// It allows administrators to view, create, disable, delete, and change roles of users.
// The component maintains state for users, loading status, error messages, and form inputs.
// It also handles API interactions and user actions through various event handlers.
export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [roleId, setRoleId] =
    useState(1);

// The loadUsers function fetches the list of users from the backend API and updates the component state accordingly.
// It handles errors and redirects to the login page if the user is not authenticated or authorized.
  async function loadUsers() {
    try {
      setError(null);

      const response =
        await getUsers();

      setUsers(response.items);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (
        error instanceof ApiError &&
        error.status === 403
      ) {
        router.replace("/inventory");
        return;
      }

      setError(getUserFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate() {
    try {
      setError(null);

      await createUser({
        username,
        password,
        roleId,
      });

      setUsername("");
      setPassword("");
      setRoleId(1);
      setCreateOpen(false);

      await loadUsers();
    } catch (error) {
  setError(getUserFriendlyErrorMessage(error));
}
  }

// The handleDisable function disables a user by calling the disableUser API function.
// It prompts the administrator for confirmation before proceeding and reloads the user list upon success.
  async function handleDisable(
    user: AdminUser,
  ) {
    const confirmed =
      window.confirm(
        `Disable "${user.username}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await disableUser(
        user.id,
      );

      await loadUsers();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(getUserFriendlyErrorMessage(error));
      }
    }
  }

  async function handleEnable(
  user: AdminUser,
) {
  const confirmed =
    window.confirm(
      `Enable "${user.username}"?`,
    );

  if (!confirmed) {
    return;
  }

  try {
    await enableUser(
      user.id,
    );

    await loadUsers();
  } catch (error) {
    if (
      error instanceof ApiError
    ) {
      setError(getUserFriendlyErrorMessage(error));
    } else {
      setError(getUserFriendlyErrorMessage(error));
    }
  }
}
// The handleDelete function deletes a user permanently by calling the deleteUser API function.
// It prompts the administrator for confirmation before proceeding and reloads the user list upon success.
  async function handleDelete(
    user: AdminUser,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${user.username}" permanently?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(
        user.id,
      );

      await loadUsers();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(getUserFriendlyErrorMessage(error));
      }
    }
  }

// The handleRoleChange function changes the role of a user by calling the changeUserRole API function.
// It updates the user's role in the backend and reloads the user list upon success.
  async function handleRoleChange(
    user: AdminUser,
    newRoleId: number,
  ) {
    try {
      await changeUserRole(
        user.id,
        newRoleId,
      );

      await loadUsers();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(getUserFriendlyErrorMessage(error));
      }
    }
  }

// The handleResetPassword function resets a user's password by calling the resetUserPassword API function.
// It prompts the administrator to enter a new password and updates the user's password in the backend upon confirmation.
  async function handleResetPassword(
    user: AdminUser,
  ) {
    const newPassword =
      window.prompt(
        `New password for "${user.username}":`,
      );

    if (!newPassword) {
      return;
    }

    try {
      await resetUserPassword(
        user.id,
        newPassword,
      );

      window.alert(
        "Password reset successfully.",
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(getUserFriendlyErrorMessage(error));
      }
    }
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading users...
      </p>
    );
  }

// The component renders the user management interface, including a table of users, a form for creating new users, and buttons for disabling, deleting, and resetting passwords for existing users.
// It also displays error messages and loading indicators as needed.
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Users
          </h1>

          <p className="text-sm text-slate-500">
            Manage warehouse users and roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setCreateOpen(
              !createOpen,
            )
          }
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add user
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {createOpen && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-bold">
            Create user
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
              placeholder="Username"
              className="rounded-lg border px-3 py-2"
            />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="Password"
              className="rounded-lg border px-3 py-2"
            />

            <select
              value={roleId}
              onChange={(event) =>
                setRoleId(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="rounded-lg border px-3 py-2"
            >
              <option value={1}>
                WORKER
              </option>

              <option value={2}>
                ADMIN
              </option>
            </select>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Create
            </button>

            <button
              type="button"
              onClick={() =>
                setCreateOpen(false)
              }
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow">
  {/* Desktop table */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full min-w-[950px]">
      <thead className="border-b bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm">
            Username
          </th>

          <th className="px-4 py-3 text-left text-sm">
            Role
          </th>

          <th className="px-4 py-3 text-left text-sm">
            Status
          </th>

          <th className="px-4 py-3 text-right text-sm">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b last:border-0"
          >
            <td className="px-4 py-3 font-medium">
              {user.username}
            </td>

            <td className="px-4 py-3">
              <select
                value={user.role.id}
                onChange={(event) =>
                  void handleRoleChange(
                    user,
                    Number(event.target.value),
                  )
                }
                className="rounded-lg border px-2 py-1 text-sm"
              >
                <option value={1}>
                  WORKER
                </option>

                <option value={2}>
                  ADMIN
                </option>
              </select>
            </td>

            <td className="px-4 py-3">
              {user.isActive ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                  ACTIVE
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-600">
                  DISABLED
                </span>
              )}
            </td>

            <td className="px-4 py-3">
              <div className="flex justify-end gap-2">
                {user.isActive ? (
                  <button
                    type="button"
                    onClick={() =>
                      void handleDisable(user)
                    }
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void handleEnable(user)
                    }
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Enable
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleResetPassword(user)
                  }
                  className="rounded-lg border px-3 py-1.5 text-sm"
                >
                  Reset password
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(user)
                  }
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="divide-y md:hidden">
    {users.map((user) => (
      <div
        key={user.id}
        className="p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 break-words">
              {user.username}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              User ID: {user.id}
            </p>
          </div>

          {user.isActive ? (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              ACTIVE
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-600">
              DISABLED
            </span>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Role
          </label>

          <select
            value={user.role.id}
            onChange={(event) =>
              void handleRoleChange(
                user,
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value={1}>
              WORKER
            </option>

            <option value={2}>
              ADMIN
            </option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {user.isActive ? (
            <button
              type="button"
              onClick={() =>
                void handleDisable(user)
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                void handleEnable(user)
              }
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Enable
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              handleResetPassword(user)
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Reset password
          </button>

          <button
            type="button"
            onClick={() =>
              handleDelete(user)
            }
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ))}

    {users.length === 0 && (
      <div className="px-4 py-10 text-center text-slate-500">
        No users found.
      </div>
    )}
  </div>
</div>
    </section>
  );
}