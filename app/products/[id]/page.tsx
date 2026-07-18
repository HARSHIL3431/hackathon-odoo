import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AddToCartForm from '@/components/AddToCartForm';
import Link from 'next/link';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Back to Catalog
        </Link>
      </div>
      
      <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
          {product.description || 'No detailed description available.'}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-b border-gray-200 py-6">
          <div>
            <span className="block text-sm text-gray-500">Rental Rate</span>
            <span className="block text-lg font-medium text-gray-900">₹{product.rentalPricePerDay} / day</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Refundable Deposit</span>
            <span className="block text-lg font-medium text-gray-900">₹{product.depositAmount}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Late Fee</span>
            <span className="block text-lg font-medium text-red-600">₹{product.lateFeePerDay} / day late</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Availability</span>
            {product.stockQty > 0 ? (
              <span className="block text-lg font-medium text-green-600">{product.stockQty} in stock</span>
            ) : (
              <span className="block text-lg font-medium text-red-600">Out of stock</span>
            )}
          </div>
        </div>

        {product.stockQty > 0 ? (
          <AddToCartForm product={product} />
        ) : (
          <div className="mt-8 rounded bg-gray-100 p-6 text-center text-gray-500">
            This item is currently out of stock.
          </div>
        )}
      </div>
    </div>
  );
}
