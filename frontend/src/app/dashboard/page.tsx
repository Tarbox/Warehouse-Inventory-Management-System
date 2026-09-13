"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";

import {
  ApiError,
  getCategories,
  getCurrentUser,
  getInventory,
  type Category,
  type InventoryItem,
  type User,
} from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();

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
        setItems(inventoryResponse.items);
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Loading dashboard...
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

  const totalQuantity = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  const lowStockCount = items.filter(
    (item) => item.lowStock,
  ).length;

  return (
  <AppShell
    isAdmin={user?.role.name === "ADMIN"}
    >
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Dashboard
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Welcome, {user?.username}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Materials
          </p>
          <p className="mt-2 text-3xl font-bold">
            {items.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Categories
          </p>
          <p className="mt-2 text-3xl font-bold">
            {categories.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Low Stock
          </p>
          <p className="mt-2 text-3xl font-bold">
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Total Quantity
          </p>
          <p className="mt-2 text-3xl font-bold">
            {totalQuantity}
          </p>
        </div>
      </div>
    </div>
  </AppShell>
);
}