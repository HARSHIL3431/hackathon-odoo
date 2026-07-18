import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdminAccess();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAccess();
    const data = await request.json();
    
    // Convert necessary types
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

    const product = await prisma.product.create({
      data: productData
    });

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
