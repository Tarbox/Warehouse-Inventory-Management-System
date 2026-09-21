"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
  useInventoryRealtime,
} from "../../hooks/useInventoryRealtime";

import RealtimeStatus from "../../components/realtime/RealtimeStatus";

import { useLocale } from "../../lib/i18n/LocaleProvider";

import {
  getUserFriendlyErrorMessage,
} from "../../lib/apiError";

import {
  ApiError,
  decrementInventory,
  getCategories,
  getCurrentUser,
  getInventory,
  incrementInventory,
  setInventory,
  logout,
  type Category,
  type InventorySortBy,
  type InventorySortOrder,
  type InventoryItem,
  type User,
} from "../../lib/api";

import AppShell from "../../components/layout/AppShell";

// InventoryPage is the main inventory management screen.
// The business logic is shared between desktop and mobile layouts.

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-500">
            Loading inventory...
          </p>
        </main>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const lowStockOnly =
    searchParams.get("lowStock") === "true";

  const categoryIdParam =
    searchParams.get("categoryId");

  const categoryId = categoryIdParam
    ? Number(categoryIdParam)
    : undefined;

  const [user, setUser] =
    useState<User | null>(null);

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState<InventorySortBy>("name");

  const [categories, setCategories] = 
    useState<Category[]>([]);

  const [sortOrder, setSortOrder] =
    useState<InventorySortOrder>("asc");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [setQuantityValue, setSetQuantityValue] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      currentSortBy: InventorySortBy = sortBy,
      currentSortOrder: InventorySortOrder = sortOrder,
    ) => {
      try {
        setError(null);

        const [userResponse, inventoryResponse] =
          await Promise.all([
            getCurrentUser(),
            getInventory(
              currentSortBy,
              currentSortOrder,
              categoryId,
            ),
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
            getUserFriendlyErrorMessage(error),
          );

      } finally {
        setLoading(false);
      }
    },
    [router, sortBy, sortOrder, categoryId],
  );

  // Apply realtime updates only when the received version
  // is newer than the current local version.
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

  // Subscribe to realtime inventory updates.
  const { status: realtimeStatus } =
  useInventoryRealtime({
    onInventoryUpdated:
      handleInventoryUpdated,
  });

  // loadCategory
  useEffect(() => {
  async function loadCategories() {
    try {
      const response = await getCategories();
      setCategories(response.items);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  }

  loadCategories();
}, []);

const activeCategory = categoryId
  ? categories.find(
      (category) => category.id === categoryId,
    )
  : undefined;

  // Load initial page data.
  useEffect(() => {
    load();
  }, [load]);

  // Start editing an exact quantity.
  function startSetQuantity(
    item: InventoryItem,
  ) {
    setEditingId(item.id);

    setSetQuantityValue(
      String(item.quantity),
    );

    setError(null);
  }

  // Set an exact inventory quantity.
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
        t.inventory.setQuantityError,
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
          getUserFriendlyErrorMessage(error),
        );

        await load();

        return;
      }

      if (error instanceof ApiError) {
        getUserFriendlyErrorMessage(error);
      } else {
        setError(
          getUserFriendlyErrorMessage(error),
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  // Increment or decrement inventory by one unit.
  async function changeQuantity(
    materialId: number,
    direction:
      | "increment"
      | "decrement",
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
          if (
            item.id !== materialId
          ) {
            return item;
          }

          if (
            response.version <=
            item.version
          ) {
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

          setError(
      getUserFriendlyErrorMessage(error),
    );
    } finally {
      setUpdatingId(null);
    }
  }

  // Log out and redirect to login.
  async function handleLogout() {
    await logout();

    router.replace("/login");
    router.refresh();
  }

  function handleSort(
    column: InventorySortBy,
  ) {
    if (sortBy === column) {
      setSortOrder((currentOrder) =>
        currentOrder === "asc"
          ? "desc"
          : "asc",
      );

      return;
    }

    setSortBy(column);
    setSortOrder("asc");
  }

  function handleMobileSortChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const column =
      event.target.value as InventorySortBy;

    if (column === sortBy) {
      return;
    }

    setSortBy(column);
    setSortOrder("asc");
  }

  function sortIndicator(
    column: InventorySortBy,
  ) {
    if (sortBy !== column) {
      return "↕";
    }

    return sortOrder === "asc"
      ? "↑"
      : "↓";
  }

  // Filter materials by name and optionally
  // by low-stock status from the URL.
  const filteredItems =
    items.filter((item) => {
      const matchesSearch =
        item.name
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          );

      const matchesLowStock =
        !lowStockOnly ||
        item.lowStock;

      return (
        matchesSearch &&
        matchesLowStock
      );
    });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          {t.inventory.loading}
        </p>
      </main>
    );
  }

  return (
    <AppShell
      isAdmin={
        user?.role.name === "ADMIN"
      }
    >
      <div>
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t.inventory.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {t.inventory.description}
            </p>
             <RealtimeStatus
              status={realtimeStatus}
          />

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
                {t.inventory.logout}
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            placeholder={
              t.inventory.searchPlaceholder
            }
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* Active low-stock filter */}
        {lowStockOnly && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-red-700">
              {t.inventory.lowStock}
            </span>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/inventory",
                )
              }
              className="text-sm font-medium text-red-700 underline hover:no-underline"
            >
              Clear
            </button>
          </div>
        )}
        {activeCategory && (
  <div>
    <span>
      Category: {activeCategory.name}
    </span>

    <button
      onClick={() => router.push("/inventory")}
    >
      ×
    </button>
  </div>
)}

        {/* Mobile sorting */}
        <div className="mb-4 flex gap-2 md:hidden">
          <select
            value={sortBy}
            onChange={
              handleMobileSortChange
            }
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="name">
              {t.inventory.item}
            </option>

            <option value="category">
              {t.inventory.category}
            </option>

            <option value="quantity">
              {t.inventory.quantity}
            </option>

            <option value="status">
              {t.inventory.status}
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              setSortOrder(
                (currentOrder) =>
                  currentOrder === "asc"
                    ? "desc"
                    : "asc",
              )
            }
            className="min-w-12 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            aria-label="Toggle sort order"
          >
            {sortOrder === "asc"
              ? "↑"
              : "↓"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ========================= */}
        {/* Desktop inventory table    */}
        {/* ========================= */}

        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("name")
                      }
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {t.inventory.item}

                      <span aria-hidden="true">
                        {sortIndicator(
                          "name",
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort(
                          "category",
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {t.inventory.category}

                      <span aria-hidden="true">
                        {sortIndicator(
                          "category",
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort(
                          "quantity",
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {t.inventory.quantity}

                      <span aria-hidden="true">
                        {sortIndicator(
                          "quantity",
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort(
                          "status",
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {t.inventory.status}

                      <span aria-hidden="true">
                        {sortIndicator(
                          "status",
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5 text-right">
                    {t.inventory.actions}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className={
                        item.lowStock
                          ? "border-t border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-t border-slate-100 hover:bg-slate-50"
                      }
                    >
                      {/* Item */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {item.name}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {t.inventory.minimum}:{" "}
                          {
                            item.minimumQuantity
                          }{" "}
                          {item.unit}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-slate-600">
                        {
                          item.category
                            .name
                        }
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3">
                        {editingId ===
                        item.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                setQuantityValue
                              }
                              onChange={(
                                event,
                              ) =>
                                setSetQuantityValue(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              disabled={
                                updatingId ===
                                item.id
                              }
                              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-center outline-none focus:border-slate-500"
                            />

                            <button
                              type="button"
                              disabled={
                                updatingId ===
                                item.id
                              }
                              onClick={() =>
                                handleSetQuantity(
                                  item,
                                )
                              }
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                            >
                              {t.inventory.save}
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingId ===
                                item.id
                              }
                              onClick={() => {
                                setEditingId(
                                  null,
                                );

                                setSetQuantityValue(
                                  "",
                                );
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              {t.inventory.cancel}
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
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              −
                            </button>

                            <div className="min-w-20 text-center">
                              <div className="text-base font-bold tabular-nums text-slate-900">
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
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {item.lowStock ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            {
                              t.inventory
                                .lowStock
                            }
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {
                              t.inventory
                                .inStock
                            }
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {editingId !==
                          item.id && (
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              item.id
                            }
                            onClick={() =>
                              startSetQuantity(
                                item,
                              )
                            }
                            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {
                              t.inventory
                                .setQuantity
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ),
                )}

                {filteredItems.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      {
                        t.inventory
                          .noMaterials
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================= */}
        {/* Mobile inventory cards     */}
        {/* ========================= */}

        <div className="space-y-3 md:hidden">
          {filteredItems.map(
            (item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Material information */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-slate-900">
                        {item.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          item.category
                            .name
                        }
                      </p>
                    </div>

                    {item.lowStock ? (
                      <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        {
                          t.inventory
                            .lowStock
                        }
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {
                          t.inventory
                            .inStock
                        }
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {t.inventory.minimum}:{" "}
                    {
                      item.minimumQuantity
                    }{" "}
                    {item.unit}
                  </p>
                </div>

                {/* Mobile quantity controls */}
                {editingId ===
                item.id ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        setQuantityValue
                      }
                      onChange={(event) =>
                        setSetQuantityValue(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        updatingId ===
                        item.id
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          item.id
                        }
                        onClick={() =>
                          handleSetQuantity(
                            item,
                          )
                        }
                        className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {t.inventory.save}
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          item.id
                        }
                        onClick={() => {
                          setEditingId(
                            null,
                          );

                          setSetQuantityValue(
                            "",
                          );
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {
                          t.inventory
                            .cancel
                        }
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-5">
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                            item.id ||
                          item.quantity ===
                            0
                        }
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            "decrement",
                          )
                        }
                        className="h-11 w-11 rounded-lg border border-slate-300 text-xl font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>

                      <div className="min-w-20 text-center">
                        <div className="text-xl font-bold text-slate-900">
                          {item.quantity}
                        </div>

                        <div className="text-xs text-slate-400">
                          {item.unit}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          item.id
                        }
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            "increment",
                          )
                        }
                        className="h-11 w-11 rounded-lg border border-slate-300 text-xl font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={
                        updatingId === item.id
                      }
                      onClick={() =>
                        startSetQuantity(
                          item,
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {
                        t.inventory
                          .setQuantity
                      }
                    </button>
                  </>
                )}
              </div>
            ),
          )}

          {filteredItems.length ===
            0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              {
                t.inventory
                  .noMaterials
              }
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}