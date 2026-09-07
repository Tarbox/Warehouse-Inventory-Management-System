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
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              📦 Warehouse Inventory
            </h1>

            {user && (// If the user is logged in, display their username and role in the header.
              <p className="text-sm text-slate-500">
                {user.username} ·{" "}
                {user.role.name}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {user?.role.name === "ADMIN" && (
    <button
      type="button"
      onClick={() => router.push("/admin")}
      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Admin Panel
    </button>
  )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
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
                {editingId === item.id ? (
                  <>
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
                      disabled={updatingId === item.id}
                      className="w-24 rounded-lg border px-3 py-2 text-center"
                    />

                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() =>
                        handleSetQuantity(item)
                      }
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => {
                        setEditingId(null);
                        setSetQuantityValue("");
                      }}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
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

                    <button
                      type="button"
                      disabled={
                        updatingId === item.id
                      }
                      onClick={() =>
                        startSetQuantity(item)
                      }
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      Set
                    </button>
                  </>
                )}
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