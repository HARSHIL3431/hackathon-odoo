import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireVendorAccess } from '@/lib/auth';
import { processTransition } from '@/lib/rental-logic';
import { z } from 'zod';

const transitionSchema = z.object({
  action: z.enum(['pickup', 'return', 'settle']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate and Authorize (Vendor or Admin required)
    const user = await requireVendorAccess();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Validate Request Body
    const body = await request.json();
    const result = transitionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid transition action' }, { status: 400 });
    }
    const { action } = result.data;

    const { id } = await params;

    // 3. Execute Transition Logic
    await prisma.$transaction(async (tx) => {
      await processTransition(tx, id, action);
    }, { timeout: 30000 }); // Same timeout as checkout for Neon

    return NextResponse.json({ success: true, message: `Transition ${action} successful` });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ((error instanceof Error ? error.message : String(error)).startsWith('409:')) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)).replace('409: ', '') }, { status: 409 });
      }
      if ((error instanceof Error ? error.message : String(error)).startsWith('400:')) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)).replace('400: ', '') }, { status: 400 });
      }
    }
    console.error('Transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
