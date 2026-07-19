import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;
    const body = await request.json();

    const { action, amount, reason } = body as {
      action: 'increase' | 'decrease' | 'set';
      amount: number;
      reason?: string;
    };

    if (!action || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: action and amount' },
        { status: 400 }
      );
    }

    if (!['increase', 'decrease', 'set'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be increase, decrease, or set.' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-negative integer.' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let newQty: number;
    if (action === 'increase') {
      newQty = product.stockQty + amount;
    } else if (action === 'decrease') {
      newQty = Math.max(0, product.stockQty - amount);
    } else {
      newQty = amount;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stockQty: newQty },
    });

    return NextResponse.json({
      message: `Stock ${action === 'set' ? 'set to' : action === 'increase' ? 'increased by' : 'decreased by'} ${amount}. New stock: ${newQty}`,
      previousQty: product.stockQty,
      newQty,
      reason: reason || null,
      product: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
