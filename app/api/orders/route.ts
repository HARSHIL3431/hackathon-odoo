import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processCheckout, CheckoutItem } from '@/lib/rental-logic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const items: CheckoutItem[] = body.items;
    const method: string = body.method;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Execute the checkout process inside an atomic transaction
    const orderIds = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, session.userId, items, method);
    });

    return NextResponse.json({ success: true, orderIds });
  } catch (error: any) {
    console.error('Checkout error:', error);
    // 409 Conflict is appropriate for business logic violations like insufficient stock
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 409 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const orders = await prisma.rentalOrder.findMany({
      where: { customerId: session.userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
