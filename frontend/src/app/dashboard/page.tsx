"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import AppShell from "../../components/layout/AppShell";

import {
  useInventoryRealtime,
} from "../../hooks/useInventoryRealtime";

import { useLocale } from "../../lib/i18n/LocaleProvider";

import {
  ApiError,
  getCategories,
  getCurrentUser,
  getInventory,
  logout,
  type Category,
  type InventoryItem,
  type User,
} from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLocale();

  const [user, setUser] =
    useState<User | null>(null);

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // Handle realtime inventory updates.
  // Ignore stale events using the inventory version.
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
            if (item.id !== materialId) {
              return item;
            }

            if (version <= item.version) {
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
  useInventoryRealtime({
    onInventoryUpdated:
      handleInventoryUpdated,
  });

  // Load dashboard data.
  useEffect(() => {
    async function loadDashboard() {
      try {
        setError(null);

        const [
          userResponse,
          inventoryResponse,
          categoriesResponse,
        ] = await Promise.all([
          getCurrentUser(),
          getInventory(),
          getCategories(),
        ]);

        setUser(userResponse.user);

        setItems(
          inventoryResponse.items,
        );

        setCategories(
          categoriesResponse.items,
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
          error instanceof ApiError
            ? error.message
            : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  // Navigate to the complete inventory.
  function openInventory() {
    router.push("/inventory");
  }

  // Navigate to inventory filtered by low stock.
  function openLowStock() {
    router.push(
      "/inventory?lowStock=true",
    );
  }

  // Navigate to categories administration.
  function openCategories() {
    router.push("/admin/categories");
  }

  // Log out and redirect to login.
  async function handleLogout() {
    await logout();

    router.replace("/login");
    router.refresh();
  }

  // Total quantity of all materials.
  const totalQuantity =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

  // Number of materials currently below
  // or equal to their minimum quantity.
  const lowStockCount =
    items.filter(
      (item) => item.lowStock,
    ).length;

  const isAdmin = user?.role.name === "ADMIN";

  // Build category cards with the number
  // of materials belonging to each category.
  const categoryCards =
    categories.map((category) => ({
      ...category,

      materialCount:
        items.filter(
          (item) =>
            item.category.id ===
            category.id,
        ).length,
    }));

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          {t.dashboard.loading}
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t.dashboard.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {t.dashboard.welcome},{" "}
              {user?.username}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.common.logout}
          </button>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Materials */}
          <button
            type="button"
            onClick={openInventory}
            className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              {t.dashboard.materials}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {items.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {t.dashboard.viewInventory}
            </p>
          </button>

          {/* Categories */}
          {isAdmin && (
  <button
    type="button"
    onClick={() => router.push("/admin/categories")}
    className="rounded-xl border bg-white p-5 text-left transition hover:shadow-md"
  >
    <p className="text-sm text-slate-500">
      {t.dashboard.categories}
    </p>

    <p className="mt-2 text-3xl font-bold">
      {categories.length}
    </p>

    <p className="mt-2 text-sm text-slate-500">
      {t.dashboard.viewCategories}
    </p>
  </button>
          )}

          {/* Low Stock */}
          <button
  type="button"
  onClick={() => router.push("/inventory?lowStock=true")}
  className={`rounded-xl border p-5 text-left transition hover:shadow-md ${
    lowStockCount > 0
      ? "border-red-300 bg-red-50"
      : "bg-white"
  }`}
>
  <p
    className={`text-sm ${
      lowStockCount > 0
        ? "text-red-700"
        : "text-slate-500"
    }`}
  >
    {t.dashboard.lowStock}
  </p>

  <p
    className={`mt-2 text-3xl font-bold ${
      lowStockCount > 0
        ? "text-red-700"
        : "text-slate-900"
    }`}
  >
    {lowStockCount}
  </p>

  <p
    className={`mt-2 text-sm ${
      lowStockCount > 0
        ? "text-red-600"
        : "text-slate-500"
    }`}
  >
    {t.dashboard.viewLowStock}
  </p>
</button>

          {/* Total Quantity */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              {t.dashboard.totalQuantity}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalQuantity}
            </p>
          </div>
        </div>

        {/* Categories */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t.dashboard.categories}
            </h2>
          </div>

          {categoryCards.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                {t.dashboard.noCategories}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryCards.map(
                (category) => (
                  <div
                    key={category.id}
                    onClick={() =>
                      router.push(
                          `/inventory?categoryId=${category.id}`,
                      )
                    }
                    className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="h-32 bg-white">
  {category.imageUrl ? (
    <img
      src={category.imageUrl}
      alt={category.name}
      className="h-full w-full object-contain p-3"
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <span className="text-sm text-slate-500">
        {t.dashboard.categoryImage}
      </span>
    </div>
  )}
</div>

                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900">
                        {category.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {category.materialCount}{" "}
                        {t.dashboard.materialsCount}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}