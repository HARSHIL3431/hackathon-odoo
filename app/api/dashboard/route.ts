import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVendorAccess, AuthError } from '@/lib/auth';
import { startOfDay, endOfDay, isBefore } from 'date-fns';

export async function GET() {
  try {
    await requireVendorAccess(); // Vendor or Admin

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Active rentals: state = Active
    const activeRentals = await prisma.rentalOrder.count({
      where: { state: 'Active' },
    });

    // Due today: state = Active AND endDate is today
    const dueToday = await prisma.rentalOrder.count({
      where: {
        state: 'Active',
        endDate: { gte: todayStart, lte: todayEnd },
      },
    });

    // Overdue: state = Active AND endDate < today
    const overdue = await prisma.rentalOrder.count({
      where: {
        state: 'Active',
        endDate: { lt: todayStart },
      },
    });

    // Revenue: sum of successful payments
    const revenueResult = await prisma.payment.aggregate({
      where: { status: 'Success' },
      _sum: { amount: true },
    });
    const revenue = revenueResult._sum.amount ?? 0;

    // Deposits held: sum of depositAmount for orders in Paid/PickedUp/Active states where deposit not yet refunded
    const depositsResult = await prisma.rentalOrder.aggregate({
      where: {
        state: { in: ['Paid', 'PickedUp', 'Active'] },
      },
      _sum: { depositAmount: true },
    });
    const depositsHeld = depositsResult._sum.depositAmount ?? 0;

    // Late fees collected: sum of penaltyAmount for settled orders
    const lateFeesResult = await prisma.rentalOrder.aggregate({
      where: {
        state: 'Settled',
        penaltyAmount: { gt: 0 },
      },
      _sum: { penaltyAmount: true },
    });
    const lateFeesCollected = lateFeesResult._sum.penaltyAmount ?? 0;

    return NextResponse.json({
      activeRentals,
      dueToday,
      overdue,
      revenue,
      depositsHeld,
      lateFeesCollected,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
