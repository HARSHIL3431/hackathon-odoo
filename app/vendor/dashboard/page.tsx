import { requireVendorAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import DashboardWidget from '@/components/DashboardWidget';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  try {
    await requireVendorAccess();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) redirect('/login');
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600">403</h1>
            <p className="mt-2 text-lg text-gray-700">Vendor access required</p>
          </div>
        </div>
      );
    }
    throw error;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Real DB aggregates — fetched directly for performance
  const [
    activeRentals,
    dueToday,
    overdue,
    revenueResult,
    depositsResult,
    lateFeesResult,
  ] = await Promise.all([
    prisma.rentalOrder.count({ where: { state: 'Active' } }),
    prisma.rentalOrder.count({
      where: { state: 'Active', endDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.rentalOrder.count({
      where: { state: 'Active', endDate: { lt: todayStart } },
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of rental operations</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardWidget label="Active Rentals" value={activeRentals} color="text-amber-600" />
        <DashboardWidget label="Due Today" value={dueToday} color="text-blue-600" />
        <DashboardWidget label="Overdue" value={overdue} color="text-red-600" />
        <DashboardWidget label="Total Revenue" value={`₹${revenue.toLocaleString()}`} color="text-green-600" />
        <DashboardWidget label="Deposits Held" value={`₹${depositsHeld.toLocaleString()}`} />
        <DashboardWidget label="Late Fees Collected" value={`₹${lateFeesCollected.toLocaleString()}`} />
      </div>
    </div>
  );
}
