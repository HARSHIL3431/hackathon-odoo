import { requireVendorAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import DashboardWidget from '@/components/DashboardWidget';
import { AlertCircle, Clock, CheckCircle2, IndianRupee, Wallet, FileWarning } from 'lucide-react';
import { OrderState } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  try {
    await requireVendorAccess();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) redirect('/login');
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied (403)</h1>
          <p className="mt-2 text-muted-foreground">Vendor access is required to view this dashboard.</p>
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

  // Real DB aggregates — fetched directly for performance
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
      where: {
        state: OrderState.Paid,
        startDate: { gt: todayEnd },
      },
    }),
    prisma.rentalOrder.count({
      where: {
        state: OrderState.Paid,
        startDate: { lte: todayEnd },
      },
    }),
    prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
    }),
    prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        endDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        endDate: { lt: todayStart },
      },
    }),
    prisma.rentalOrder.count({
      where: {
        state: OrderState.Settled,
        updatedAt: { gte: firstDayOfMonth },
      },
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

  return (
    <div className="flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor rental operations and financial metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardWidget 
          label="Upcoming Bookings" 
          value={upcomingBookings} 
          icon={<Clock className="text-blue-500" />} 
          color="text-blue-500"
        />
        <DashboardWidget 
          label="Ready for Pickup" 
          value={readyForPickup} 
          icon={<AlertCircle className="text-purple-500" />} 
          color="text-purple-500"
        />
        <DashboardWidget 
          label="Currently Rented" 
          value={currentlyRented} 
          icon={<CheckCircle2 className="text-primary" />} 
          color="text-primary"
        />
        <DashboardWidget 
          label="Due Today" 
          value={dueToday} 
          icon={<Clock className="text-amber-500" />} 
          color="text-amber-500" 
        />
        <DashboardWidget 
          label="Overdue" 
          value={overdue} 
          icon={<AlertCircle className="text-destructive" />} 
          color="text-destructive" 
        />
        <DashboardWidget 
          label="Completed This Month" 
          value={completedThisMonth} 
          icon={<CheckCircle2 className="text-green-500" />} 
          color="text-green-500" 
        />
        <DashboardWidget 
          label="Total Revenue" 
          value={`₹${revenue.toLocaleString()}`} 
          icon={<IndianRupee className="text-green-600" />}
        />
        <DashboardWidget 
          label="Deposits Held" 
          value={`₹${depositsHeld.toLocaleString()}`} 
          icon={<Wallet className="text-muted-foreground" />}
        />
        <DashboardWidget 
          label="Late Fees Collected" 
          value={`₹${lateFeesCollected.toLocaleString()}`} 
          icon={<FileWarning className="text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
