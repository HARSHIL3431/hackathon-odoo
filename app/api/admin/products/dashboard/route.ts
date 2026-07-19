import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import { OrderState } from '@prisma/client';

const LOW_STOCK_THRESHOLD = 3;

export async function GET() {
  try {
    await requireAdminAccess();

    const now = new Date();

    const [
      totalProducts,
      activeProducts,
      archivedProducts,
      outOfStockProducts,
      lowStockProducts,
      allActiveProducts,
      reservedData,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { isActive: true, stockQty: 0 } }),
      prisma.product.count({
        where: { isActive: true, stockQty: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, stockQty: true, rentalPricePerDay: true, depositAmount: true },
      }),
      prisma.rentalOrder.groupBy({
        by: ['productId'],
        where: {
          state: {
            in: [OrderState.Confirmed, OrderState.Paid, OrderState.PickedUp, OrderState.Active],
          },
          startDate: { lt: now },
          endDate: { gt: now },
        },
        _sum: { quantity: true },
      }),
    ]);

    const reservedMap = new Map<string, number>();
    for (const r of reservedData) {
      reservedMap.set(r.productId, r._sum.quantity || 0);
    }

    let totalStockValue = 0;
    let totalReserved = 0;
    for (const p of allActiveProducts) {
      totalStockValue += p.stockQty * p.rentalPricePerDay;
      totalReserved += reservedMap.get(p.id) || 0;
    }

    const totalStock = allActiveProducts.reduce((sum, p) => sum + p.stockQty, 0);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      archivedProducts,
      outOfStockProducts,
      lowStockProducts,
      totalStock,
      totalReserved,
      totalAvailable: totalStock - totalReserved,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
