"use client";

import { useState } from "react";
import Link from "next/link";
import AppNavigation from "./AppNavigation";
import MobileNavigation from "./MobileNavigation";
import { useLocale } from "../../lib/i18n/LocaleProvider";
import LanguageSwitcher from "../../lib/i18n/LanguageSwitcher";

type AppShellProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
};

export default function AppShell({
  children,
  isAdmin = false,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Global application header */}
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
              aria-label={t.common.openNavigation}
            >
              <span className="text-xl">☰</span>
            </button>

            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight"
            >
              Warehouse Inventory
            </Link>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Application navigation */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
  <div className="p-4">
    <AppNavigation isAdmin={isAdmin} />
  </div>
</aside>
{mobileOpen && (
  <div className="fixed inset-0 z-50 md:hidden">
    {/* Overlay */}
    <button
      type="button"
      aria-label={t.common.closeNavigation}
      onClick={() => setMobileOpen(false)}
      className="absolute inset-0 bg-black/40"
    />

    {/* Drawer */}
    <aside className="relative h-full w-72 bg-white shadow-xl">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <span className="font-semibold text-slate-900">
          {t.common.navigation}
        </span>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label={t.common.closeNavigation}
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <MobileNavigation
          isAdmin={isAdmin}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>
    </aside>
  </div>
)}

        {/* Page content */}
        <main className="min-w-0 flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}