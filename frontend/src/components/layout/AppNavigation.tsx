"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavigationProps = {
  isAdmin: boolean;
};

export default function AppNavigation({
  isAdmin,
}: AppNavigationProps) {
  const pathname = usePathname();

  function linkClass(href: string) {
  const isActive =
    href === "/inventory" || href === "/admin"
      ? pathname === href
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

  return (
    <nav className="space-y-1">
      <Link
        href="/inventory"
        className={linkClass("/inventory")}
      >
        Inventory
      </Link>

      {isAdmin && (
        <>
          <div className="my-3 border-t border-slate-200" />

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administration
          </p>

          <Link
            href="/admin"
            className={linkClass("/admin")}
          >
            Dashboard
          </Link>

          <Link
            href="/admin/categories"
            className={linkClass("/admin/categories")}
          >
            Categories
          </Link>

          <Link
            href="/admin/materials"
            className={linkClass("/admin/materials")}
          >
            Materials
          </Link>

          <Link
            href="/admin/users"
            className={linkClass("/admin/users")}
          >
            Users
          </Link>

          <Link
            href="/admin/history"
            className={linkClass("/admin/history")}
          >
            History
          </Link>

          <Link
            href="/admin/settings"
            className={linkClass("/admin/settings")}
          >
            Settings
          </Link>
        </>
      )}
    </nav>
  );
}