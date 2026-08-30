"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  getInventory,
  type InventoryItem,
} from "../../../lib/api";

import { useRouter } from "next/navigation";

export default function AdminMaterialsPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await getInventory();

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
          "Failed to load materials",
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
        Loading materials...
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Materials
          </h1>

          <p className="text-sm text-slate-500">
            Manage warehouse materials.
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add material
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">
                Material
              </th>

              <th className="px-4 py-3 text-left text-sm">
                Category
              </th>

              <th className="px-4 py-3 text-left text-sm">
                Quantity
              </th>

              <th className="px-4 py-3 text-left text-sm">
                Minimum
              </th>

              <th className="px-4 py-3 text-left text-sm">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b last:border-0"
              >
                <td className="px-4 py-3 font-medium">
                  {item.name}
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {item.category.name}
                </td>

                <td className="px-4 py-3">
                  {item.quantity}{" "}
                  {item.unit}
                </td>

                <td className="px-4 py-3">
                  {item.minimumQuantity}
                </td>

                <td className="px-4 py-3">
                  {item.lowStock ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                      LOW STOCK
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}