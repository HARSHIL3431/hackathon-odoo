import { requireVendorAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import DashboardWidget from '@/components/DashboardWidget';
import { AlertCircle, Clock, CheckCircle2, Wallet, FileWarning, ArrowRight, Package, ShieldCheck } from 'lucide-react';
import { OrderState } from '@prisma/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  try {
    await requireVendorAccess();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) redirect('/login');
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center animate-fade-in">
          <AlertCircle className="h-16 w-16 text-destructive mb-4 animate-pulse-slow" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">Vendor authorization is required to view this dashboard.</p>
        </div>
      );
    }
    throw error;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const rentedStates = [OrderState.PickedUp, OrderState.Active];
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Real DB aggregates
  const [
    upcomingBookings,
    readyForPickup,
    currentlyRented,
    dueToday,
    overdue,
    completedThisMonth,
    revenueResult,
    depositsResult,
    lateFeesResult,
  ] = await Promise.all([
    prisma.rentalOrder.count({
      where: { state: OrderState.Paid, startDate: { gt: todayEnd } },
    }),
    prisma.rentalOrder.count({
      where: { state: OrderState.Paid, startDate: { lte: todayEnd } },
    }),
    prisma.rentalOrder.count({
      where: { state: { in: rentedStates }, startDate: { lte: todayEnd }, endDate: { gte: todayStart } },
    }),
    prisma.rentalOrder.count({
      where: { state: { in: rentedStates }, endDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.rentalOrder.count({
      where: { state: { in: rentedStates }, endDate: { lt: todayStart } },
    }),
    prisma.rentalOrder.count({
      where: { state: OrderState.Settled, updatedAt: { gte: firstDayOfMonth } },
    }),
    prisma.payment.aggregate({
      where: { status: 'Success' },
      _sum: { amount: true },
    }),
    prisma.rentalOrder.aggregate({
      where: { state: { in: ['Paid', 'PickedUp', 'Active'] } },
      _sum: { depositAmount: true },
    }),
    prisma.rentalOrder.aggregate({
      where: { state: 'Settled', penaltyAmount: { gt: 0 } },
      _sum: { penaltyAmount: true },
    }),
  ]);

  const revenue = revenueResult._sum.amount ?? 0;
  const depositsHeld = depositsResult._sum.depositAmount ?? 0;
  const lateFeesCollected = lateFeesResult._sum.penaltyAmount ?? 0;

  // Fake chart data for the demo
  const upcomingData = [2, 4, 1, 5, 3, upcomingBookings];
  const rentedData = [10, 12, 14, 13, 15, currentlyRented];

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Operations</h1>
        <p className="text-muted-foreground text-lg">Manage equipment handovers, active rentals, and returns.</p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardWidget 
          label="Ready for Pickup" 
          value={readyForPickup} 
          icon={<Package />} 
          color="text-purple-600"
          chartData={[1, 3, 2, readyForPickup, readyForPickup+1, readyForPickup]}
        />
        <DashboardWidget 
          label="Currently Rented" 
          value={currentlyRented} 
          icon={<ShieldCheck />} 
          color="text-emerald-600"
          chartData={rentedData}
          chartType="line"
        />
        <DashboardWidget 
          label="Due Today" 
          value={dueToday} 
          icon={<Clock />} 
          color="text-amber-600" 
        />
        <DashboardWidget 
          label="Overdue Returns" 
          value={overdue} 
          icon={<AlertCircle />} 
          color="text-destructive" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
        
        {/* Financial & Pipeline Matrix */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-lg">Financial & Pipeline Metrics</h3>
            <p className="text-sm text-muted-foreground">Secondary operational data.</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 bg-gradient-to-br from-background to-muted/10">
            <DashboardWidget 
              label="Upcoming Bookings" 
              value={upcomingBookings} 
              icon={<Clock />} 
              color="text-blue-600"
              chartData={upcomingData}
            />
            <DashboardWidget 
              label="Completed (Month)" 
              value={completedThisMonth} 
              icon={<CheckCircle2 />} 
              color="text-slate-600" 
            />
            <DashboardWidget 
              label="Deposits Held" 
              value={depositsHeld} 
              formatPrefix="₹"
              icon={<Wallet />}
              color="text-slate-600"
            />
          </div>
        </div>

        {/* Quick Actions / Schedule */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-lg">Today's Schedule</h3>
          </div>
          <div className="p-4 flex flex-col gap-2 flex-1">
            <Link href="/vendor/orders?filter=ready" className="flex items-center justify-between p-4 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 border border-purple-100 dark:border-purple-900/50 transition-colors group">
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-300">Pending Handovers</p>
                <p className="text-sm text-purple-700/80 dark:text-purple-400/80 mt-1">{readyForPickup} items waiting for customers</p>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link href="/vendor/orders?filter=due" className="flex items-center justify-between p-4 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 transition-colors group mt-2">
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300">Expected Returns</p>
                <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">{dueToday} items due back today</p>
              </div>
              <ArrowRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            {overdue > 0 && (
              <Link href="/vendor/orders?filter=overdue" className="flex items-center justify-between p-4 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/50 transition-colors group mt-2">
                <div>
                  <p className="font-medium text-red-900 dark:text-red-300">Critical: Overdue</p>
                  <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1">{overdue} items require attention</p>
                </div>
                <ArrowRight className="h-5 w-5 text-red-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
