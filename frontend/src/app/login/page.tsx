"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { ApiError, login } from "../../lib/api";

import { useLocale } from "../../lib/i18n/LocaleProvider";

import LanguageSwitcher from "../../lib/i18n/LanguageSwitcher";

import { getApiErrorKey } from "../../lib/apiError";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(username, password);

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
  if (error instanceof ApiError) {
    setError(
      t.apiErrors[getApiErrorKey(error)],
    );
  } else {
    setError(
      t.login.connectionError,
    );
  }
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">
            📦
          </div>

          <h1 className="text-2xl font-bold">
            {t.login.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {t.login.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium"
            >
              {t.login.username}
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
              disabled={loading}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              {t.login.password}
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              disabled={loading}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? t.login.submitting
              : t.login.submit}
          </button>
        </form>
      </div>
    </main>
  );
}