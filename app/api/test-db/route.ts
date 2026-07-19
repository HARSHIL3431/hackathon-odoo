import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await prisma.rentalOrder.count();
    const first = await prisma.rentalOrder.findFirst();
    return NextResponse.json({ count, first });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
