import { requireAdminPage } from "@/lib/auth/guards";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";
import { ToastProvider } from "@/components/store/toast";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <ToastProvider>
      <div className="grid min-h-screen grid-cols-1 bg-cream-100 text-ink lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <AdminSidebar name={user.name} role={user.role} />
          </div>
        </div>
        <div className="min-w-0">
          <header className="border-b border-beige-300 bg-cream-50 px-4 py-3 lg:hidden">
            <p className="font-serif text-lg font-semibold text-forest-900">Sarya Pure Admin</p>
            <AdminMobileNav name={user.name} role={user.role} />
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
