import React from 'react';
import Link from 'next/link';
import { Product } from '@prisma/client';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-6 flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {product.description || 'No description available.'}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">₹{product.rentalPricePerDay} <span className="text-gray-500">/ day</span></p>
            <p className="text-xs text-gray-500">Deposit: ₹{product.depositAmount}</p>
          </div>
          <div className="text-right">
            {product.stockQty > 0 ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                In Stock ({product.stockQty})
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
        <Link
          href={`/products/${product.id}`}
          className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
