import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
};

export default function AppShell({
  children,
  isAdmin = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Global application header */}
      <header className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href="/inventory"
            className="text-lg font-semibold tracking-tight"
          >
            Warehouse Inventory
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Application navigation */}
        <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
          <div className="p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </p>

            <nav className="space-y-1">
              <Link
                href="/inventory"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Inventory
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/admin/categories"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Categories
                  </Link>

                  <Link
                    href="/admin/materials"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Materials
                  </Link>

                  <Link
                    href="/admin/users"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Users
                  </Link>

                  <Link
                    href="/admin/history"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    History
                  </Link>

                  <Link
                    href="/admin/settings"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Settings
                  </Link>
                </>
              )}
            </nav>
          </div>
        </aside>

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