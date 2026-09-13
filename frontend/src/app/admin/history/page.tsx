"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  getHistory,
  type HistoryItem,
} from "../../../lib/api";

import { useRouter } from "next/navigation";

export default function AdminHistoryPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<HistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await getHistory();

        setItems(response.items);
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

        setError(
          "Failed to load history",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading history...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Inventory History
        </h1>

        <p className="text-sm text-slate-500">
          Audit log of inventory changes.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
  {/* Desktop table */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full min-w-[800px]">
      <thead className="border-b bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm">
            Date
          </th>

          <th className="px-4 py-3 text-left text-sm">
            User
          </th>

          <th className="px-4 py-3 text-left text-sm">
            Material
          </th>

          <th className="px-4 py-3 text-right text-sm">
            Old
          </th>

          <th className="px-4 py-3 text-right text-sm">
            New
          </th>

          <th className="px-4 py-3 text-right text-sm">
            Difference
          </th>

          <th className="px-4 py-3 text-left text-sm">
            Operation
          </th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b last:border-0"
          >
            <td className="px-4 py-3 text-sm text-slate-600">
              {new Date(
                item.createdAt,
              ).toLocaleString()}
            </td>

            <td className="px-4 py-3">
              {item.user.username}
            </td>

            <td className="px-4 py-3 font-medium">
              {item.material.name}
            </td>

            <td className="px-4 py-3 text-right">
              {item.oldQuantity}
            </td>

            <td className="px-4 py-3 text-right">
              {item.newQuantity}
            </td>

            <td className="px-4 py-3 text-right">
              {item.difference > 0
                ? `+${item.difference}`
                : item.difference}
            </td>

            <td className="px-4 py-3 text-sm">
              {item.operation}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="divide-y md:hidden">
    {items.map((item) => (
      <div
        key={item.id}
        className="p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 break-words">
              {item.material.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {new Date(
                item.createdAt,
              ).toLocaleString()}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {item.operation}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Old
            </p>
            <p className="mt-1 font-semibold">
              {item.oldQuantity}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              New
            </p>
            <p className="mt-1 font-semibold">
              {item.newQuantity}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Difference
            </p>
            <p className="mt-1 font-semibold">
              {item.difference > 0
                ? `+${item.difference}`
                : item.difference}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-500">
            User
          </p>

          <p className="mt-1 text-sm font-medium">
            {item.user.username}
          </p>
        </div>
      </div>
    ))}

    {items.length === 0 && (
      <div className="px-4 py-10 text-center text-slate-500">
        No history records found.
      </div>
    )}
  </div>
</div>
    </section>
  );
}