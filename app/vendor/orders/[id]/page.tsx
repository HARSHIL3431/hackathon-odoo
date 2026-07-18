import { requireVendorAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { format } from 'date-fns';
import { OrderState } from '@prisma/client';
import { TransitionButtons } from './TransitionButtons';

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireVendorAccess();
  if (!user) redirect('/login');

  const { id } = await params;
  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
    },
  });

  if (!order) return notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Order {order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Created on {format(order.createdAt, 'PPP')}
          </p>
        </div>
        <OrderStatusBadge state={order.state} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Rental Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Product</dt>
              <dd className="font-medium">{order.product.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Duration</dt>
              <dd className="font-medium">
                {format(order.startDate, 'MMM d, yyyy')} - {format(order.endDate, 'MMM d, yyyy')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium">{order.quotationType}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Customer</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{order.customer.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{order.customer.email}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 md:col-span-2">
          <h3 className="font-semibold text-slate-900">Financials</h3>
          <dl className="space-y-2 text-sm max-w-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Rental Total</dt>
              <dd className="font-medium">₹{order.totalAmount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Deposit Paid</dt>
              <dd className="font-medium">₹{order.depositAmount}</dd>
            </div>
            {order.state === OrderState.Settled && (
              <>
                <div className="flex justify-between text-red-600">
                  <dt>Late Penalty Applied</dt>
                  <dd className="font-medium">₹{order.penaltyAmount}</dd>
                </div>
                <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                  <dt>Deposit Refunded</dt>
                  <dd className="font-semibold">₹{order.depositRefunded}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
        <TransitionButtons orderId={order.id} currentState={order.state} />
      </div>
    </div>
  );
}
