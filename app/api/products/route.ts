import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, AuthError } from '@/lib/auth';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { name, description, rentalPricePerDay, depositAmount, lateFeePerDay, stockQty } = body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        rentalPricePerDay: parseFloat(rentalPricePerDay),
        depositAmount: parseFloat(depositAmount),
        lateFeePerDay: parseFloat(lateFeePerDay),
        stockQty: parseInt(stockQty, 10),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
