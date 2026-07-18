import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { LayoutDashboard, PackageSearch } from 'lucide-react';

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== Role.VENDOR && session.role !== Role.ADMIN)) {
    redirect('/login');
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] w-full">
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-6">
          <h2 className="font-semibold text-lg">Vendor Portal</h2>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="grid gap-1 px-4">
            <Link href="/vendor/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link href="/vendor/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted">
              <PackageSearch className="h-4 w-4" />
              Manage Orders
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
