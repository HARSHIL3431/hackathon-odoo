'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartBadge() {
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const count = items.length;

  return (
    <Link href="/cart" className="text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center">
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
          {count}
        </span>
      )}
    </Link>
  );
}
