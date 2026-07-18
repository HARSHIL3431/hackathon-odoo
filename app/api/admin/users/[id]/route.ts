import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOnly } from '@/lib/auth';
import { z } from 'zod';
import { Role } from '@prisma/client';

const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isApproved: z.boolean().optional(),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOnly();
    const params = await props.params;

    const body = await request.json();
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { role, isApproved } = result.data;

    // Prevent changing your own role/status to avoid locking out the only admin
    // Note: robust implementation would check session ID, for hackathon assuming admin manages others.

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(role !== undefined && { role }),
        ...(isApproved !== undefined && { isApproved }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    if ((error instanceof Error ? error.message : String(error)) === 'Forbidden') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
