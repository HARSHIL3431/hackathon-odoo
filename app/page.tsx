import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

import { Product } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Ensure we fetch fresh products on every load

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Equipment Catalog</h1>
        <p className="mt-2 text-lg text-gray-600">Browse and rent our available equipment.</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          No products available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
