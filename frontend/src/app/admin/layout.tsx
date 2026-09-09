// This is the layout component for the admin section of the application. It provides a consistent structure and navigation for all admin pages.
import Link from "next/link";

// The AdminLayout component wraps the content of admin pages and provides a navigation bar for easy access to different sections of the admin interface.
export default function AdminLayout({
  children,
}: {
// The children prop represents the content of the specific admin page that will be rendered within this layout.
  children: React.ReactNode;
}) {
// The layout consists of a sidebar with navigation links and a main content area where the specific admin page content will be displayed.
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
          <span className="font-bold">
            Admin
          </span>

          <nav className="flex gap-4 text-sm">
            <Link
              href="/inventory"
              className="hover:underline"
            >
              Inventory
            </Link>

            <Link
              href="/admin/materials"
              className="hover:underline"
            >
              Materials
            </Link>

            <Link
              href="/admin/history"
              className="hover:underline"
            >
              History
            </Link>
            <Link
              href="/admin/users"
              className="hover:underline"
            >
              Users
            </Link>
            <Link
              href="/admin/settings"
              className="hover:underline"
            >
              Settings
            </Link>

            <Link
              href="/admin/categories"
              className="hover:underline"
            >
              Categories
            </Link>
          </nav>
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
