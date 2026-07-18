import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { Product } from '@prisma/client';
import { PackageSearch } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure we fetch fresh products on every load

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Equipment Catalog</h1>
        <p className="text-muted-foreground text-lg">
          Browse and rent our available premium equipment.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              We currently don&apos;t have any equipment available in the catalog.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
