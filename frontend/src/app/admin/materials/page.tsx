"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  deleteMaterial,
  getInventory,
  type InventoryItem,
} from "../../../lib/api";

import {
  getUserFriendlyErrorMessage,
} from "../../../lib/apiError";

import {
  useInventoryRealtime,
} from "../../../hooks/useInventoryRealtime";

import { useRouter } from "next/navigation";

import { MaterialForm } from "../../../components/admin/MaterialForm";

export default function AdminMaterialsPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingMaterial, setEditingMaterial] =
    useState<InventoryItem | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const loadMaterials = useCallback(async () => {
    try {
      setError(null);

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

      setError(getUserFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
  void loadMaterials();
}, [loadMaterials]);

const handleMaterialCreated = useCallback(() => {
  void loadMaterials();
}, [loadMaterials]);

const handleMaterialDeleted = useCallback(() => {
  void loadMaterials();
}, [loadMaterials]);

const handleMaterialUpdated = useCallback(() => {
  void loadMaterials();
}, [loadMaterials]);

useInventoryRealtime({
  onMaterialCreated: handleMaterialCreated,
  onMaterialUpdated: handleMaterialUpdated,
  onMaterialDeleted: handleMaterialDeleted,
});
  function openCreateForm() {
    setEditingMaterial(null);
    setFormOpen(true);
  }

  function openEditForm(
    material: InventoryItem,
  ) {
    setEditingMaterial(material);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingMaterial(null);
  }

  async function handleDelete(
    material: InventoryItem,
  ) {
    const confirmed =
      window.confirm(
        `Disable material "${material.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(material.id);
      setError(null);

      await deleteMaterial(
        material.id,
      );

      await loadMaterials();
    } catch (error) {
  setError(getUserFriendlyErrorMessage(error));
} finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading materials...
      </p>
    );
  }

  return (
    <section>
      {!formOpen ? (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              onClick={openCreateForm}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add material
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl bg-white shadow">
  {/* Desktop table */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full min-w-[850px]">
      <thead className="border-b bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm">
            Material
          </th>

          <th className="px-4 py-3 text-left text-sm">
            Category
          </th>

          <th className="px-4 py-3 text-right text-sm">
            Quantity
          </th>

          <th className="px-4 py-3 text-right text-sm">
            Minimum
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
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b last:border-0"
          >
            <td className="px-4 py-3">
              <div className="font-medium">
                {item.name}
              </div>

              {item.description && (
                <div className="mt-1 text-xs text-slate-500">
                  {item.description}
                </div>
              )}
            </td>

            <td className="px-4 py-3 text-sm text-slate-600">
              {item.category.name}
            </td>

            <td className="px-4 py-3 text-right">
              {item.quantity} {item.unit}
            </td>

            <td className="px-4 py-3 text-right">
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

            <td className="px-4 py-3">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(item)
                  }
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={
                    deletingId === item.id
                  }
                  onClick={() =>
                    void handleDelete(item)
                  }
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === item.id
                    ? "Disabling..."
                    : "Disable"}
                </button>
              </div>
            </td>
          </tr>
        ))}

        {items.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="px-4 py-10 text-center text-slate-500"
            >
              No materials found.
            </td>
          </tr>
        )}
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
              {item.name}
            </p>

            {item.description && (
              <p className="mt-1 text-sm text-slate-500 break-words">
                {item.description}
              </p>
            )}
          </div>

          {item.lowStock ? (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
              LOW STOCK
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              OK
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Category
            </p>

            <p className="mt-1 text-sm font-medium break-words">
              {item.category.name}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Quantity
            </p>

            <p className="mt-1 text-sm font-semibold">
              {item.quantity} {item.unit}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Minimum
            </p>

            <p className="mt-1 text-sm font-semibold">
              {item.minimumQuantity}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <p className="mt-1 text-sm font-medium">
              {item.lowStock
                ? "Low stock"
                : "OK"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              openEditForm(item)
            }
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={
              deletingId === item.id
            }
            onClick={() =>
              void handleDelete(item)
            }
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === item.id
              ? "Disabling..."
              : "Disable"}
          </button>
        </div>
      </div>
    ))}

    {items.length === 0 && (
      <div className="px-4 py-10 text-center text-slate-500">
        No materials found.
      </div>
    )}
  </div>
</div>
        </>
      ) : (
        <MaterialForm
          material={
            editingMaterial
          }
          onSaved={async () => {
            closeForm();

            await loadMaterials();
          }}
          onCancel={closeForm}
        />
      )}
    </section>
  );
}