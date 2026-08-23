"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  decrementInventory,
  getCurrentUser,
  getInventory,
  incrementInventory,
  logout,
  type InventoryItem,
  type User,
} from "../../lib/api";

import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    try {
      setError(null);

      const [userResponse, inventoryResponse] =
        await Promise.all([
          getCurrentUser(),
          getInventory(),
        ]);

      setUser(userResponse.user);
      setItems(inventoryResponse.items);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        router.replace("/login");
        return;
      }

      setError(
        "Failed to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeQuantity(
    materialId: number,
    direction: "increment" | "decrement",
  ) {
    setUpdatingId(materialId);
    setError(null);

    try {
      const response =
        direction === "increment"
          ? await incrementInventory(
              materialId,
              1,
            )
          : await decrementInventory(
              materialId,
              1,
            );

      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id !== materialId) {
            return item;
          }

          return {
            ...item,

            quantity:
              response.newQuantity,

            version:
              response.version,

            lowStock:
              response.newQuantity <=
              item.minimumQuantity,
          };
        }),
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (
        error instanceof ApiError
      ) {
        setError(error.message);
      } else {
        setError(
          "Failed to update inventory",
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  const filteredItems =
    items.filter((item) =>
      item.name
        .toLowerCase()
        .includes(
          search.toLowerCase(),
        ),
    );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">
          Loading inventory...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              📦 Warehouse Inventory
            </h1>

            {user && (
              <p className="text-sm text-slate-500">
                {user.username} ·{" "}
                {user.role.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search materials..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-semibold">
                  {item.name}
                </h2>

                <p className="text-sm text-slate-500">
                  {item.category.name}
                </p>

                {item.lowStock && (
                  <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    LOW STOCK
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={
                    updatingId === item.id ||
                    item.quantity === 0
                  }
                  onClick={() =>
                    changeQuantity(
                      item.id,
                      "decrement",
                    )
                  }
                  className="h-10 w-10 rounded-lg border text-lg font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <div className="min-w-24 text-center">
                  <div className="text-lg font-bold">
                    {item.quantity}
                  </div>

                  <div className="text-xs text-slate-500">
                    {item.unit}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    updatingId === item.id
                  }
                  onClick={() =>
                    changeQuantity(
                      item.id,
                      "increment",
                    )
                  }
                  className="h-10 w-10 rounded-lg border text-lg font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500">
              No materials found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}