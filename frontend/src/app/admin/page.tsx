"use client";

import {
  useEffect,
} from "react";

import {
  getCurrentUser,
  type User,
} from "../../lib/api";

import { useRouter } from "next/navigation";
import { useLocale } from "../../lib/i18n/LocaleProvider";

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  useEffect(() => {
    async function checkAccess() {
      try {
        const response =
          await getCurrentUser();

        const user: User =
          response.user;

        if (
          user.role.name !== "ADMIN"
        ) {
          router.replace(
            "/inventory",
          );
        }
      } catch {
        router.replace("/login");
      }
    }

    checkAccess();
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t.admin.title}
      </h1>

      <p className="mt-2 text-slate-500">
        {t.admin.description}
      </p>
    </div>
  );
}