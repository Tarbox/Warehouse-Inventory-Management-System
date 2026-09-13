"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from "../../../lib/api";

import { useRouter } from "next/navigation";
import { useLocale } from "../../../lib/i18n/LocaleProvider";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { t } = useLocale();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  async function loadCategories() {
    try {
      setError(null);

      const response =
        await getCategories();

      setCategories(response.items);
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
        "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCreateForm() {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(
    category: Category,
  ) {
    setEditingCategory(category);
    setName(category.name);
    setDescription(
      category.description ?? "",
    );
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCategory(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError(
        t.categories.nameRequired,
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          {
            name: trimmedName,
            description:
              trimmedDescription || null,
          },
        );
      } else {
        await createCategory({
          name: trimmedName,
          description:
            trimmedDescription || null,
        });
      }

      closeForm();

      await loadCategories();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(error.message);
      } else {
        setError(
          editingCategory
            ? t.categories.updateError
            : t.categories.createError,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    category: Category,
  ) {
    const confirmed =
      window.confirm(
  `${t.categories.deleteConfirm} "${category.name}"?`,
);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError(null);

      await deleteCategory(
        category.id,
      );

      await loadCategories();
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(error.message);
      } else {
        setError(
          t.categories.deleteError
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        {t.categories.loading}
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
                {t.categories.title}
              </h1>

              <p className="text-sm text-slate-500">
                {t.categories.description}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {t.categories.add}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl bg-white shadow">
  {/* Desktop table */}
  <div className="hidden md:block">
    <table className="w-full">
      <thead className="border-b bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-medium">
            {t.categories.name}
          </th>

          <th className="px-4 py-3 text-left text-sm font-medium">
            {t.categories.descriptionField}
          </th>

          <th className="px-4 py-3 text-right text-sm font-medium">
            {t.categories.actions}
          </th>
        </tr>
      </thead>

      <tbody>
        {categories.map((category) => (
          <tr
            key={category.id}
            className="border-b last:border-0"
          >
            <td className="px-4 py-3 font-medium">
              {category.name}
            </td>

            <td className="px-4 py-3 text-sm text-slate-600">
              {category.description || "—"}
            </td>

            <td className="px-4 py-3">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(category)
                  }
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  {t.categories.editAction}
                </button>

                <button
                  type="button"
                  disabled={
                    deletingId === category.id
                  }
                  onClick={() =>
                    handleDelete(category)
                  }
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === category.id
                    ? t.categories.deleting
                    : t.categories.deleteAction}
                </button>
              </div>
            </td>
          </tr>
        ))}

        {categories.length === 0 && (
          <tr>
            <td
              colSpan={3}
              className="px-4 py-10 text-center text-slate-500"
            >
              {t.categories.empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="space-y-3 p-3 md:hidden">
    {categories.map((category) => (
      <div
        key={category.id}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <h2 className="font-semibold text-slate-900">
            {category.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {category.description || "No description"}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() =>
              openEditForm(category)
            }
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {t.categories.editAction}
          </button>

          <button
            type="button"
            disabled={
              deletingId === category.id
            }
            onClick={() =>
              handleDelete(category)
            }
            className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === category.id
              ? t.categories.deleting
              : t.categories.deleteAction}
          </button>
        </div>
      </div>
    ))}

    {categories.length === 0 && (
      <div className="px-4 py-10 text-center text-sm text-slate-500">
        {t.categories.empty}
      </div>
    )}
  </div>
</div>
        </>
      ) : (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {editingCategory
                ? t.categories.edit
                : t.categories.add}
            </h1>

            <p className="text-sm text-slate-500">
              {editingCategory
                ? t.categories.updateName
                : t.categories.addName}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl bg-white p-6 shadow"
          >
            <div>
              <label
                htmlFor="category-name"
                className="mb-1 block text-sm font-medium"
              >
                {t.categories.name}
              </label>

              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder={t.categories.exmpl}
              />
            </div>

            <div>
              <label
                htmlFor="category-description"
                className="mb-1 block text-sm font-medium"
              >
                {t.categories.descriptionField}
              </label>

              <textarea
                id="category-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder={t.categories.descriptionPlaceholder}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {t.categories.cancel}
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !name.trim()
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingCategory
                    ? t.categories.save
                    : t.categories.create}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}