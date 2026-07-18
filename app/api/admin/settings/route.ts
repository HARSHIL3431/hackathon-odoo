import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOnly } from '@/lib/auth';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  lateFeeDefault: z.number().min(0),
  gracePeriodHours: z.number().min(0),
});

export async function GET() {
  try {
    await requireAdminOnly();
    // Use upsert to ensure the "global" settings row always exists
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', lateFeeDefault: 20, gracePeriodHours: 24 }
    });
    return NextResponse.json(settings);
  } catch (error: unknown) {
    if ((error instanceof Error ? error.message : String(error)) === 'Forbidden') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminOnly();
    const body = await request.json();
    const result = updateSettingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: result.data,
      create: { id: 'global', ...result.data }
    });

    return NextResponse.json(settings);
  } catch (error: unknown) {
    if ((error instanceof Error ? error.message : String(error)) === 'Forbidden') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
