import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';

export async function GET(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;
    
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;
    const data = await request.json();
    
    const productData = {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      image: data.image || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      rentalPricePerDay: parseFloat(data.rentalPricePerDay),
      depositAmount: parseFloat(data.depositAmount),
      lateFeePerDay: parseFloat(data.lateFeePerDay),
      stockQty: parseInt(data.stockQty),
      sku: data.sku || null,
      manufacturer: data.manufacturer || null,
      brand: data.brand || null,
      barcode: data.barcode || null,
      assetCode: data.assetCode || null,
    };

    const product = await prisma.product.update({
      where: { id },
      data: productData
    });

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;

    // Check for rental history
    const historyCount = await prisma.rentalOrder.count({
      where: { productId: id }
    });

    if (historyCount > 0) {
      // Soft delete
      const product = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ message: 'Product archived successfully due to existing rental history.', product });
    } else {
      // Hard delete
      await prisma.product.delete({
        where: { id }
      });
      return NextResponse.json({ message: 'Product permanently deleted.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
