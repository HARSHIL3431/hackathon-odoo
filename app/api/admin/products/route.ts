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
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'archived') {
      where.isActive = false;
    }

    const validSortFields = ['name', 'category', 'rentalPricePerDay', 'stockQty', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAccess();
    const data = await request.json();

    // Validate required fields
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) errors.push('Product Name is required.');
    if (!data.category || !data.category.trim()) errors.push('Category is required.');
    if (data.rentalPricePerDay === undefined || parseFloat(data.rentalPricePerDay) <= 0)
      errors.push('Rental Price must be a positive number.');
    if (data.depositAmount === undefined || parseFloat(data.depositAmount) < 0)
      errors.push('Deposit Amount must be non-negative.');
    if (data.lateFeePerDay === undefined || parseFloat(data.lateFeePerDay) < 0)
      errors.push('Late Fee must be non-negative.');
    if (data.stockQty === undefined || parseInt(data.stockQty) < 0)
      errors.push('Stock Quantity must be non-negative.');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    // SKU uniqueness check
    if (data.sku && data.sku.trim()) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku.trim() },
      });
      if (existing) {
        return NextResponse.json({ error: `SKU "${data.sku}" already exists.` }, { status: 409 });
      }
    }

    const productData = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      category: data.category.trim(),
      image: data.image || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      rentalPricePerDay: parseFloat(data.rentalPricePerDay),
      depositAmount: parseFloat(data.depositAmount),
      lateFeePerDay: parseFloat(data.lateFeePerDay),
      stockQty: parseInt(data.stockQty),
      sku: data.sku?.trim() || null,
      manufacturer: data.manufacturer?.trim() || null,
      brand: data.brand?.trim() || null,
      barcode: data.barcode || null,
      assetCode: data.assetCode || null,
    };

    const product = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
