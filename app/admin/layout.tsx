import { requireAdminOnly } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminOnly(); // Ensure only admins can access /admin routes

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex-shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Admin Portal</h2>
        </div>
        <nav className="mt-6">
          <Link href="/admin/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/users" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            User Management
          </Link>
          <Link href="/admin/pricelists" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            Pricelists
          </Link>
          <Link href="/admin/settings" className="block px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
            Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
