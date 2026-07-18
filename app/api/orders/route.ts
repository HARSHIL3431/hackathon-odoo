import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
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

// Business rule error messages that should return 409 (conflict)
const BUSINESS_RULE_ERRORS = [
  'Insufficient stock',
  'Start date cannot be in the past',
  'End date cannot be before start date',
  'Product not found',
];

export async function POST(req: NextRequest) {
  try {
    const session = await requireCustomerAccess(); // CUSTOMER or ADMIN

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { items, method } = parsed.data;

    // Execute the checkout inside an atomic transaction (30s timeout for Neon serverless latency)
    const orderIds = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, session.userId, items, method);
    }, { timeout: 30000 });

    return NextResponse.json({ success: true, orderIds });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: error.statusCode });
    }
    const message = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Checkout failed';
    console.error('Checkout error:', message);
    // Business rule conflicts (validated in rental-logic) return 409
    const isBusinessRuleError = BUSINESS_RULE_ERRORS.some(e => message.includes(e));
    return NextResponse.json({ error: message }, { status: isBusinessRuleError ? 409 : 500 });
  }
}

export async function GET() {
  try {
    const session = await requireCustomerAccess(); // CUSTOMER or ADMIN

    const orders = await prisma.rentalOrder.findMany({
      where: { customerId: session.userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: error.statusCode });
    }
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
