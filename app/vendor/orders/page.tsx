import { requireVendorAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { RentalOrder, Product, User, OrderState } from '@prisma/client';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

type OrderWithRelations = RentalOrder & { product: Product; customer: User };

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  try {
    await requireVendorAccess();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) redirect('/login');
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600">403</h1>
            <p className="mt-2 text-lg text-gray-700">Vendor access required</p>
          </div>
        </div>
      );
    }
    throw error;
  }

  const { filter } = await searchParams;
  const todayStart = startOfDay(new Date());

  // Build filter conditions
  let stateFilter: OrderState[] = [];
  if (filter === 'active') {
    stateFilter = [OrderState.Active];
  } else if (filter === 'overdue') {
    stateFilter = [OrderState.Active];
  } else if (filter === 'completed') {
    stateFilter = [OrderState.Settled];
  } else {
    stateFilter = [OrderState.Paid, OrderState.PickedUp, OrderState.Active, OrderState.Returned, OrderState.Settled];
  }

  const orders = await prisma.rentalOrder.findMany({
    where: {
      state: { in: stateFilter },
      ...(filter === 'overdue' ? { endDate: { lt: todayStart } } : {}),
    },
    include: { product: true, customer: true },
    orderBy: { createdAt: 'desc' },
  });

  const filters = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage rental orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/vendor/orders?filter=${f.value}` : '/vendor/orders'}
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition ${
              (filter || '') === f.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order: OrderWithRelations) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.startDate).toLocaleDateString()} — {new Date(order.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{order.totalAmount + order.depositAmount}
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge state={order.state} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
