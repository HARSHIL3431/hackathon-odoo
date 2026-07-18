import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVendorAccess, AuthError } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

import { OrderState } from '@prisma/client';

export async function GET() {
  try {
    await requireVendorAccess(); // Vendor or Admin

    const now = new Date();
    const todayEnd = endOfDay(now);

    const rentedStates = [OrderState.PickedUp, OrderState.Active];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Upcoming Bookings (Starts in the future)
    const upcomingBookings = await prisma.rentalOrder.count({
      where: {
        state: OrderState.Paid,
        startDate: { gt: now },
      },
    });

    // 2. Ready for Pickup (Start time has passed, but not yet picked up)
    const readyForPickup = await prisma.rentalOrder.count({
      where: {
        state: OrderState.Paid,
        startDate: { lte: now },
      },
    });

    // 3. Currently Rented (Picked up, and end time hasn't passed)
    const currentlyRented = await prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        endDate: { gte: now },
      },
    });

    // 4. Due Today (Ends later today, before midnight)
    const dueToday = await prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        endDate: { gte: now, lte: todayEnd },
      },
    });

    // 5. Overdue (Exact end time has passed)
    const overdue = await prisma.rentalOrder.count({
      where: {
        state: { in: rentedStates },
        endDate: { lt: now },
      },
    });

    // 6. Completed This Month
    const completedThisMonth = await prisma.rentalOrder.count({
      where: {
        state: OrderState.Settled,
        updatedAt: { gte: firstDayOfMonth },
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
      upcomingBookings,
      readyForPickup,
      currentlyRented,
      dueToday,
      overdue,
      completedThisMonth,
      revenue,
      depositsHeld,
      lateFeesCollected,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: error.statusCode });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
