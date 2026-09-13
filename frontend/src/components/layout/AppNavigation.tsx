"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "../../lib/i18n/LocaleProvider";

type AppNavigationProps = {
  isAdmin: boolean;
};

export default function AppNavigation({
  isAdmin,
}: AppNavigationProps) {
  const pathname = usePathname();
  const { t } = useLocale();

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
    href="/dashboard"
    className={linkClass("/dashboard")}
  >
    {t.navigation.dashboard}
  </Link>

  <Link
    href="/inventory"
    className={linkClass("/inventory")}
  >
    {t.navigation.inventory}
  </Link>

  {isAdmin && (
        <>
          <div className="my-3 border-t border-slate-200" />

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.navigation.administration}
          </p>

          <Link
            href="/admin"
            className={linkClass("/admin")}
          >
            {t.navigation.dashboard}
          </Link>

          <Link
            href="/admin/categories"
            className={linkClass("/admin/categories")}
          >
            {t.navigation.categories}
          </Link>

          <Link
            href="/admin/materials"
            className={linkClass("/admin/materials")}
          >
            {t.navigation.materials}
          </Link>

          <Link
            href="/admin/users"
            className={linkClass("/admin/users")}
          >
            {t.navigation.users}
          </Link>

          <Link
            href="/admin/history"
            className={linkClass("/admin/history")}
          >
            {t.navigation.history}
          </Link>

          <Link
            href="/admin/settings"
            className={linkClass("/admin/settings")}
          >
            {t.navigation.settings}
          </Link>
        </>
      )}
    </nav>
  );
}