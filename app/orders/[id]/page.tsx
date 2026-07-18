import prisma from '@/lib/prisma';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
import { notFound } from 'next/navigation';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireCustomerAccess();
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      redirect('/login?next=/orders');
    }
    throw error;
  }
  const { id } = await params;

  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      product: true,
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Security: Order Isolation. Must throw AuthError (403) per RULES.md.
  if (order.customerId !== session.userId) {
    throw new AuthError('Forbidden: You do not have permission to view this order.');
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice #{order.id.slice(0, 8).toUpperCase()}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <OrderStatusBadge state={order.state} />
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Product</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                {order.product.name}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rental Period</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(order.startDate).toLocaleDateString()} to {new Date(order.endDate).toLocaleDateString()}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Financial Breakdown</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Rental Amount</span>
                    <span>₹{order.totalAmount}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Refundable Deposit</span>
                    <span>₹{order.depositAmount}</span>
                  </li>
                  {order.penaltyAmount > 0 && (
                    <li className="flex justify-between text-red-600">
                      <span>Late Penalty</span>
                      <span>₹{order.penaltyAmount}</span>
                    </li>
                  )}
                  {order.depositRefunded > 0 && (
                    <li className="flex justify-between text-green-600">
                      <span>Deposit Refunded</span>
                      <span>-₹{order.depositRefunded}</span>
                    </li>
                  )}
                  <li className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total Paid</span>
                    <span>₹{order.totalAmount + order.depositAmount}</span>
                  </li>
                </ul>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment History</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.payments.length > 0 ? (
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {order.payments.map((payment) => (
                      <li key={payment.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <span className="ml-2 flex-1 w-0 truncate">
                            {payment.method} - {new Date(payment.paidAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="font-medium text-green-600">₹{payment.amount} ({payment.status})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No payments recorded.</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
