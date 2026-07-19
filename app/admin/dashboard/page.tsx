import prisma from '@/lib/prisma';
import DashboardWidget from '@/components/DashboardWidget';
import { Role } from '@prisma/client';
import { Users, UserCheck, AlertCircle, Tags, Banknote, Package, ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalVendors,
    pendingVendors,
    totalPricelists,
    totalProducts,
    totalOrders,
    revenueResult
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.VENDOR } }),
    prisma.user.count({ where: { role: Role.VENDOR, isApproved: false } }),
    prisma.pricelist.count(),
    prisma.product.count(),
    prisma.rentalOrder.count(),
    prisma.payment.aggregate({
      where: { status: 'Success' },
      _sum: { amount: true },
    })
  ]);

  const totalRevenue = revenueResult._sum.amount ?? 0;

  // Fake chart data for the demo, since we don't have historical data generation easily available
  const revenueChartData = [12000, 15000, 14000, 18000, 22000, 24000, totalRevenue > 0 ? totalRevenue : 30000];
  const orderChartData = [5, 8, 12, 10, 15, 20, totalOrders > 0 ? totalOrders : 25];

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground text-lg">Manage the platform, monitor operations, and analyze financial metrics.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget 
          label="Total Revenue" 
          value={totalRevenue} 
          formatPrefix="₹"
          icon={<Banknote />}
          color="text-emerald-600" 
          chartData={revenueChartData}
          chartType="line"
        />
        <DashboardWidget 
          label="Total Orders" 
          value={totalOrders} 
          icon={<ShoppingCart />}
          color="text-blue-600" 
          chartData={orderChartData}
        />
        <DashboardWidget 
          label="Total Products" 
          value={totalProducts} 
          icon={<Package />}
          color="text-indigo-600" 
        />
        <DashboardWidget 
          label="Active Users" 
          value={totalUsers} 
          icon={<Users />}
          color="text-primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-lg">Platform Health</h3>
            <p className="text-sm text-muted-foreground">Key operational metrics.</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 bg-gradient-to-br from-background to-muted/10">
            <DashboardWidget 
              label="Total Vendors" 
              value={totalVendors} 
              icon={<UserCheck />}
              color="text-primary" 
            />
            <DashboardWidget 
              label="Pending Vendors" 
              value={pendingVendors} 
              icon={<AlertCircle className={pendingVendors > 0 ? "text-amber-500" : "text-muted-foreground"} />}
              color={pendingVendors > 0 ? "text-amber-500" : "text-green-600"} 
            />
            <DashboardWidget 
              label="Active Pricelists" 
              value={totalPricelists} 
              icon={<Tags />}
              color="text-slate-600" 
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-lg">Quick Actions</h3>
          </div>
          <div className="p-4 flex flex-col gap-2 flex-1">
            <a href="/admin/products/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center"><Package className="h-4 w-4" /></div>
              Add New Product
            </a>
            <a href="/admin/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center"><ShoppingCart className="h-4 w-4" /></div>
              Review Orders
            </a>
            <a href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <div className="h-8 w-8 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center"><AlertCircle className="h-4 w-4" /></div>
              Manage Approvals {pendingVendors > 0 && <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingVendors}</span>}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
