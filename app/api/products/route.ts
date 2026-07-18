import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVendorAccess, AuthError } from '@/lib/auth';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  rentalPricePerDay: z.number().positive('Rental price must be positive'),
  depositAmount: z.number().nonnegative('Deposit must be non-negative'),
  lateFeePerDay: z.number().nonnegative('Late fee must be non-negative'),
  stockQty: z.number().int().min(0, 'Stock must be non-negative'),
});

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
    await requireVendorAccess(); // Vendor or Admin
    
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, description, rentalPricePerDay, depositAmount, lateFeePerDay, stockQty } = parsed.data;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        rentalPricePerDay,
        depositAmount,
        lateFeePerDay,
        stockQty,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: error.statusCode });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
