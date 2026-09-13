"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  getSettings,
  updateSetting,
  type SystemSetting,
} from "../../../lib/api";

// Import the useRouter hook from Next.js for navigation.
import { useRouter } from "next/navigation";

// The AdminSettingsPage component is responsible for displaying and managing system settings in the admin interface.
// It fetches the current settings from the backend, allows users to update them, and handles loading and error states.
// It also ensures that only authorized users can access this page and perform actions on the settings.
export default function AdminSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<SystemSetting[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  async function loadSettings() {
    try {
      setError(null);

      const response =
        await getSettings();

      setSettings(
        response.items,
      );
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
        "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }

// The useEffect hook is used to load the settings when the component mounts. It calls the loadSettings function to fetch the current settings from the backend.
// The empty dependency array ensures that this effect runs only once when the component is first rendered.
  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(
    setting: SystemSetting,
    value: string,
  ) {
    try {
      setSaving(setting.key);
      setError(null);
      setSuccess(null);

      const response =
        await updateSetting(
          setting.key,
          value,
        );
// If the update is successful, update the local state to reflect the new value of the setting.
// This ensures that the UI remains in sync with the backend after a successful update.
      setSettings(
        (current) =>
          current.map((item) =>
            item.key === setting.key
              ? response.setting
              : item,
          ),
      );

      setSuccess(
        "Setting saved successfully",
      );
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setError(error.message);
      } else {
        setError(
          "Failed to update setting",
        );
      }
    } finally {
      setSaving(null);
    }
  }
// If the settings are still loading, display a loading message to inform the user that the data is being fetched from the backend.
// This provides feedback to the user and improves the user experience while waiting for the data to be available.
  if (loading) {
    return (
      <p className="text-slate-500">
        Loading settings...
      </p>
    );
  }
// If there was an error loading the settings, display an error message to inform the user of the issue.
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage system-wide application settings.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
  <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
    {success}
  </div>
)}

      <div className="space-y-4">
        {settings.map(
          (setting) => {
            const busy =
              saving ===
              setting.key;

            return (
              <div
  key={setting.key}
  className="rounded-xl bg-white p-5 shadow"
>
  <div className="mb-4">
    <h2 className="font-semibold text-slate-900">
      {setting.key}
    </h2>

    {setting.description && (
      <p className="mt-1 text-sm text-slate-500">
        {setting.description}
      </p>
    )}
  </div>

  {setting.key === "session_duration_hours" ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:max-w-sm">
      <input
        type="number"
        min={1}
        max={168}
        defaultValue={setting.value}
        id={`setting-${setting.key}`}
        className="w-full flex-1 rounded-lg border px-3 py-2"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          const input =
            document.getElementById(
              `setting-${setting.key}`,
            ) as HTMLInputElement;

          void handleSave(
            setting,
            input.value,
          );
        }}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Saving..." : "Save"}
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row sm:max-w-sm">
      <select
        id={`setting-${setting.key}`}
        defaultValue={setting.value}
        className="w-full flex-1 rounded-lg border px-3 py-2"
      >
        <option value="PCS">PCS</option>
        <option value="BOX">BOX</option>
        <option value="ROLL">ROLL</option>
        <option value="PACK">PACK</option>
        <option value="PAIR">PAIR</option>
        <option value="OTHER">OTHER</option>
      </select>

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          const input =
            document.getElementById(
              `setting-${setting.key}`,
            ) as HTMLSelectElement;

          void handleSave(
            setting,
            input.value,
          );
        }}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Saving..." : "Save"}
      </button>
    </div>
  )}
</div>
            );
          },
        )}
      </div>
    </section>
  );
}