import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOnly } from '@/lib/auth';
import { z } from 'zod';

const createPricelistSchema = z.object({
  name: z.string().min(1),
  discountPercent: z.number().min(0).max(100),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  try {
    await requireAdminOnly();
    const pricelists = await prisma.pricelist.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(pricelists);
  } catch (error: any) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminOnly();
    const body = await request.json();
    const result = createPricelistSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (result.data.isDefault) {
      await prisma.pricelist.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const pricelist = await prisma.pricelist.create({
      data: result.data,
    });

    return NextResponse.json(pricelist, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
