import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processCheckout } from '@/lib/rental-logic';
import { z } from 'zod';

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  startDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
  endDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
  quantity: z.number().int().min(1),
});

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Cart is empty'),
  method: z.string().min(1, 'Payment method is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { items, method } = parsed.data;

    // Execute the checkout inside an atomic transaction
    const orderIds = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, session.userId, items, method);
    });

    return NextResponse.json({ success: true, orderIds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('Checkout error:', message);
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.rentalOrder.findMany({
      where: { customerId: session.userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: unknown) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
