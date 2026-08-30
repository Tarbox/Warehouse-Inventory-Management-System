"use client";

import {
  useEffect,
} from "react";

import {
  getCurrentUser,
  type User,
} from "../../lib/api";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

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
        Administration
      </h1>

      <p className="mt-2 text-slate-500">
        Select an administrative section.
      </p>
    </div>
  );
}