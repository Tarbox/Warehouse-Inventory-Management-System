"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  createMaterial,
  getCategories,
  updateMaterial,
  type Category,
  type InventoryItem,
} from "../../lib/api";

import {
  getUserFriendlyErrorMessage,
} from "../../lib/apiError";

type MaterialFormProps = {
  material?: InventoryItem | null;
  onSaved: () => void;
  onCancel: () => void;
};

const units = [
  "PCS",
  "BOX",
  "ROLL",
  "PACK",
  "PAIR",
  "OTHER",
] as const;

export function MaterialForm({
  material,
  onSaved,
  onCancel,
}: MaterialFormProps) {
  const isEditMode =
    Boolean(material);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] =
    useState(material?.name ?? "");

  const [description, setDescription] =
    useState(
      material?.description ?? "",
    );

  const [unit, setUnit] =
    useState<
      (typeof units)[number]
    >(
      (material?.unit as
        (typeof units)[number]) ??
        "PCS",
    );

  const [minimumQuantity, setMinimumQuantity] =
    useState(
      material?.minimumQuantity.toString() ??
        "0",
    );

  const [categoryId, setCategoryId] =
    useState(
      material?.category.id.toString() ??
        "",
    );

  const [initialQuantity, setInitialQuantity] =
    useState("0");

  const [loading, setLoading] =
    useState(false);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response =
          await getCategories();

        setCategories(
          response.items,
        );

        if (!categoryId) {
          setCategoryId(
            response.items[0]?.id.toString() ??
              "",
          );
        }
      } catch (error) {
  setError(getUserFriendlyErrorMessage(error));
} finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      if (!categoryId) {
        setError(
          "Please select a category",
        );

        return;
      }

      const data = {
        name: name.trim(),
        description:
          description.trim() || null,
        unit,
        minimumQuantity:
          Number(minimumQuantity),
        categoryId:
          Number(categoryId),
      };

      if (isEditMode && material) {
        await updateMaterial(
          material.id,
          data,
        );
      } else {
        await createMaterial({
          ...data,
          initialQuantity:
            Number(initialQuantity),
        });
      }

      onSaved();
    } catch (error) {
  setError(getUserFriendlyErrorMessage(error));
} finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl bg-white p-6 shadow"
    >
      <div>
        <h2 className="text-xl font-bold">
          {isEditMode
            ? "Edit material"
            : "Add material"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEditMode
            ? "Update material information."
            : "Create a new warehouse material."}
        </p>
      </div>

      <div>
        <label
          htmlFor="material-name"
          className="mb-1 block text-sm font-medium"
        >
          Name
        </label>

        <input
          id="material-name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
          maxLength={200}
          disabled={loading}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="material-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>

        <textarea
          id="material-description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          maxLength={1000}
          disabled={loading}
          rows={3}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="material-category"
            className="mb-1 block text-sm font-medium"
          >
            Category
          </label>

          <select
            id="material-category"
            value={categoryId}
            onChange={(event) =>
              setCategoryId(
                event.target.value,
              )
            }
            disabled={
              loading ||
              loadingCategories
            }
            className="w-full rounded-lg border px-3 py-2"
          >
            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="material-unit"
            className="mb-1 block text-sm font-medium"
          >
            Unit
          </label>

          <select
            id="material-unit"
            value={unit}
            onChange={(event) =>
              setUnit(
                event.target.value as
                  (typeof units)[number],
              )
            }
            disabled={loading}
            className="w-full rounded-lg border px-3 py-2"
          >
            {units.map((value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="minimum-quantity"
            className="mb-1 block text-sm font-medium"
          >
            Minimum quantity
          </label>

          <input
            id="minimum-quantity"
            type="number"
            min="0"
            step="1"
            value={minimumQuantity}
            onChange={(event) =>
              setMinimumQuantity(
                event.target.value,
              )
            }
            disabled={loading}
            required
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        {!isEditMode && (
          <div>
            <label
              htmlFor="initial-quantity"
              className="mb-1 block text-sm font-medium"
            >
              Initial quantity
            </label>

            <input
              id="initial-quantity"
              type="number"
              min="0"
              step="1"
              value={initialQuantity}
              onChange={(event) =>
                setInitialQuantity(
                  event.target.value,
                )
              }
              disabled={loading}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={
            loading ||
            loadingCategories
          }
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Save changes"
              : "Create material"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}