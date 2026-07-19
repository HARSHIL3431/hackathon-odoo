import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import { OrderState } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate reserved stock (active overlapping orders)
    const now = new Date();
    const reservedOrders = await prisma.rentalOrder.aggregate({
      where: {
        productId: id,
        state: {
          in: [OrderState.Confirmed, OrderState.Paid, OrderState.PickedUp, OrderState.Active],
        },
        startDate: { lt: now },
        endDate: { gt: now },
      },
      _sum: { quantity: true },
    });

    const reservedStock = reservedOrders._sum.quantity || 0;
    const availableStock = Math.max(0, product.stockQty - reservedStock);

    return NextResponse.json({
      ...product,
      reservedStock,
      availableStock,
      rentalCount: product._count.orders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;
    const data = await request.json();

    // Handle archive/restore shortcut
    if (Object.keys(data).length === 1 && data.isActive !== undefined) {
      const product = await prisma.product.update({
        where: { id },
        data: { isActive: data.isActive },
      });
      return NextResponse.json({
        message: data.isActive ? 'Product restored successfully.' : 'Product archived successfully.',
        product,
      });
    }

    // Full edit validation
    const errors: string[] = [];
    if (data.name !== undefined && !data.name?.trim()) errors.push('Product Name is required.');
    if (data.category !== undefined && !data.category?.trim()) errors.push('Category is required.');
    if (data.rentalPricePerDay !== undefined && parseFloat(data.rentalPricePerDay) <= 0)
      errors.push('Rental Price must be positive.');
    if (data.depositAmount !== undefined && parseFloat(data.depositAmount) < 0)
      errors.push('Deposit must be non-negative.');
    if (data.lateFeePerDay !== undefined && parseFloat(data.lateFeePerDay) < 0)
      errors.push('Late Fee must be non-negative.');
    if (data.stockQty !== undefined && parseInt(data.stockQty) < 0)
      errors.push('Stock must be non-negative.');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    // SKU uniqueness check on edit
    if (data.sku && data.sku.trim()) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku.trim(), id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: `SKU "${data.sku}" already exists.` }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.image !== undefined) updateData.image = data.image || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.rentalPricePerDay !== undefined) updateData.rentalPricePerDay = parseFloat(data.rentalPricePerDay);
    if (data.depositAmount !== undefined) updateData.depositAmount = parseFloat(data.depositAmount);
    if (data.lateFeePerDay !== undefined) updateData.lateFeePerDay = parseFloat(data.lateFeePerDay);
    if (data.stockQty !== undefined) updateData.stockQty = parseInt(data.stockQty);
    if (data.sku !== undefined) updateData.sku = data.sku?.trim() || null;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer?.trim() || null;
    if (data.brand !== undefined) updateData.brand = data.brand?.trim() || null;
    if (data.barcode !== undefined) updateData.barcode = data.barcode || null;
    if (data.assetCode !== undefined) updateData.assetCode = data.assetCode || null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Product updated successfully.', product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (permanent) {
      // Only allow permanent delete if no rental history
      const historyCount = await prisma.rentalOrder.count({
        where: { productId: id },
      });
      if (historyCount > 0) {
        return NextResponse.json(
          { error: 'This product has rental history and cannot be permanently deleted. Archive it instead.' },
          { status: 400 }
        );
      }
      await prisma.product.delete({ where: { id } });
      return NextResponse.json({ message: 'Product permanently deleted.' });
    } else {
      // Soft archive
      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: 'Product archived successfully.', product: updated });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
