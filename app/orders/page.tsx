import prisma from '@/lib/prisma';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { RentalOrder, Product } from '@prisma/client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  let session;
  try {
    session = await requireCustomerAccess(); // Protects route
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      redirect('/login?next=/orders');
    }
    throw error;
  }

  const orders = await prisma.rentalOrder.findMany({
    where: { customerId: session.userId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          You have no orders yet.
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md border border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {orders.map((order: RentalOrder & { product: Product }) => (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {/* Placeholder for product image if we add them later */}
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {order.product.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">{order.product.name}</p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          From: {new Date(order.startDate).toLocaleDateString()} &mdash; To: {new Date(order.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-900 font-medium">
                        ₹{order.totalAmount + order.depositAmount}
                      </div>
                      <OrderStatusBadge state={order.state} />
                      <div className="text-gray-400">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
