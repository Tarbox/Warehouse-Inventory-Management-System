"use client";

import {
  useEffect,
  useCallback,
  useState,
} from "react";
import {
  useInventoryRealtime,
} from "../../hooks/useInventoryRealtime";
import {
  ApiError,
  decrementInventory,
  getCurrentUser,
  getInventory,
  setInventory,
  incrementInventory,
  logout,
  type InventoryItem,
  type User,
} from "../../lib/api";
// Import the useRouter hook from Next.js to handle navigation.
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";

// The InventoryPage component is the main page for managing the warehouse inventory. It displays a list of materials, their quantities, and allows users to increment or decrement the inventory.
export default function InventoryPage() {
  const router = useRouter();
// State variables to manage user information, inventory items, search query, loading state, updating state, and error messages.
  const [user, setUser] =
    useState<User | null>(null);
// State variable to hold the list of inventory items.
  const [items, setItems] =
    useState<InventoryItem[]>([]);
// State variable to hold the search query for filtering inventory items.
  const [search, setSearch] =
    useState("");
// State variable to indicate whether the inventory data is currently being loaded.
  const [loading, setLoading] =
    useState(true);
// State variable to hold the ID of the inventory item that is currently being updated (incremented or decremented).
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);
// State variable to hold the ID of the inventory item that is currently being edited (for setting a specific quantity).
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [setQuantityValue, setSetQuantityValue] =
    useState("");
// State variable to hold any error messages that may occur during API requests or inventory updates.
  const [error, setError] =
    useState<string | null>(null);
// The load function retrieves the current user and inventory data from the backend API and updates the corresponding state variables. It also handles any errors that may occur during the API requests.
  async function load() {
    try {
      setError(null);
      // Use Promise.all to fetch the current user and inventory data concurrently.
      const [userResponse, inventoryResponse] =
        await Promise.all([
          getCurrentUser(),
          getInventory(),
        ]);
      // Update the state variables with the retrieved user and inventory data.
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
  // Handle inventory updates received from the realtime connection by updating the corresponding item in the state.
  const handleInventoryUpdated =
  useCallback(
    ({
      materialId,
      quantity,
      version,
    }: {
      materialId: number;
      quantity: number;
      version: number;
    }) => {
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (
            item.id !== materialId
          ) {
            return item;
          }

          if (
            version <= item.version
          ) {
            return item;
          }

          return {
            ...item,

            quantity,

            version,

            lowStock:
              quantity <=
              item.minimumQuantity,
          };
        }),
      );
    },
    [],
  );
// Use the useInventoryRealtime hook to subscribe to inventory updates and handle them using the handleInventoryUpdated callback.
useInventoryRealtime({
  onInventoryUpdated:
    handleInventoryUpdated,
});
// Use the useEffect hook to load the current user and inventory data when the component mounts.
  useEffect(() => {
    load();
  }, []);

  function startSetQuantity(item: InventoryItem) {
  setEditingId(item.id);

  setSetQuantityValue(
    String(item.quantity),
  );

  setError(null);
}

  async function handleSetQuantity(
  item: InventoryItem,
) {
  const quantity =
    Number(setQuantityValue);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    setError(
      "Quantity must be a non-negative integer",
    );

    return;
  }

  setUpdatingId(item.id);
  setError(null);

  try {
    const response =
      await setInventory(
        item.id,
        quantity,
        item.version,
      );

    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (
          currentItem.id !== item.id
        ) {
          return currentItem;
        }

        return {
          ...currentItem,

          quantity:
            response.newQuantity,

          version:
            response.version,

          lowStock:
            response.newQuantity <=
            currentItem.minimumQuantity,
        };
      }),
    );

    setEditingId(null);
    setSetQuantityValue("");
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
      error.code === "VERSION_CONFLICT"
    ) {
      setError(
        "Inventory was changed by another user. Please try again.",
      );

      await load();

      return;
    }

    if (error instanceof ApiError) {
      setError(error.message);
    } else {
      setError(
        "Failed to set inventory quantity",
      );
    }
  } finally {
    setUpdatingId(null);
  }
}
// The changeQuantity function is responsible for incrementing or decrementing the quantity of a specific inventory item. It updates the state to reflect the changes and handles any errors that may occur during the API requests.
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
            )// If the direction is "increment", call the incrementInventory API function to increase the quantity of the specified material by 1.
          : await decrementInventory(
              materialId,
              1,
            );
      // If the direction is "decrement", call the decrementInventory API function to decrease the quantity of the specified material by 1.
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id !== materialId) {
            return item;
          }

          if (
            response.version <= item.version
          ) {
            return item;
          }
          // Update the item in the state with the new quantity, version, and low stock status based on the response from the API.
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
      ) {// If the error is an ApiError with a status of 401 (Unauthorized), redirect the user to the login page.
        router.replace("/login");
        return;
      }

      if (// If the error is an ApiError, display the error message returned from the API. Otherwise, display a generic error message indicating that the inventory update failed.
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
// The handleLogout function logs the user out by calling the logout API function, then redirects the user to the login page and refreshes the router to clear any cached data.
  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }
// Filter the inventory items based on the search query entered by the user. The filteredItems array contains only those items whose names include the search query (case-insensitive).
  const filteredItems =
    items.filter((item) =>
      item.name
        .toLowerCase()
        .includes(
          search.toLowerCase(),
        ),
    );
// If the inventory data is still loading, display a loading message to the user.
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
  <AppShell isAdmin={user?.role.name === "ADMIN"}>
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage warehouse materials and quantities.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user.username}
              </p>

              <p className="text-xs text-slate-500">
                {user.role.name}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search materials..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Inventory table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">
                  Item
                </th>

                <th className="px-5 py-3">
                  Category
                </th>

                <th className="px-5 py-3 text-center">
                  Quantity
                </th>

                <th className="px-5 py-3">
                  Status
                </th>

                <th className="px-5 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50"
                >
                  {/* Item */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">
                      {item.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Minimum: {item.minimumQuantity}{" "}
                      {item.unit}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4 text-slate-600">
                    {item.category.name}
                  </td>

                  {/* Quantity */}
                  <td className="px-5 py-4">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={setQuantityValue}
                          onChange={(event) =>
                            setSetQuantityValue(
                              event.target.value,
                            )
                          }
                          disabled={
                            updatingId === item.id
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-center outline-none focus:border-slate-500"
                        />

                        <button
                          type="button"
                          disabled={
                            updatingId === item.id
                          }
                          onClick={() =>
                            handleSetQuantity(item)
                          }
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId === item.id
                          }
                          onClick={() => {
                            setEditingId(null);
                            setSetQuantityValue("");
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
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
                          className="h-8 w-8 rounded-lg border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>

                        <div className="w-16 text-center">
                          <div className="font-semibold text-slate-900">
                            {item.quantity}
                          </div>

                          <div className="text-xs text-slate-400">
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
                          className="h-8 w-8 rounded-lg border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    {item.lowStock ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        In Stock
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {editingId !== item.id && (
                      <button
                        type="button"
                        disabled={
                          updatingId === item.id
                        }
                        onClick={() =>
                          startSetQuantity(item)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Set Quantity
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No materials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
  );
}