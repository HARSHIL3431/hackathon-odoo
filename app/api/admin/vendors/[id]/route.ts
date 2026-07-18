import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';

export async function GET(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;
    
    const vendor = await prisma.user.findFirst({
      where: { id, role: 'VENDOR' }
    });

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    
    const { passwordHash, ...safeVendor } = vendor;
    return NextResponse.json(safeVendor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;
    const data = await request.json();
    
    const vendorData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const vendor = await prisma.user.update({
      where: { id },
      data: vendorData
    });

    const { passwordHash, ...safeVendor } = vendor;
    return NextResponse.json(safeVendor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;

    // Check for rental history
    // Vendors don't have direct rental orders under their customer ID, they own products.
    // However, the rule states: "Never permanently delete vendors. Suspend Vendor. Restore Vendor."
    
    const vendor = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Vendor suspended successfully.', vendor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
