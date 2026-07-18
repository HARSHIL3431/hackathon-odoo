import prisma from '@/lib/prisma';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
import { notFound } from 'next/navigation';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ArrowLeft, CalendarDays, IndianRupee, CreditCard, Box } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session;
  try {
    session = await requireCustomerAccess();
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      redirect(`/login?next=/orders/${id}`);
    }
    throw error;
  }

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
    throw new AuthError('Forbidden: You do not have permission to view this order.', 403);
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
            <p className="text-muted-foreground mt-1">Invoice #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <OrderStatusBadge state={order.state} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b bg-muted/20 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Box className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{order.product.name} {order.quantity > 1 ? <span className="text-muted-foreground ml-2">(x{order.quantity})</span> : null}</CardTitle>
                <CardDescription>
                  Placed on {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Rental Period</p>
                  <p className="text-muted-foreground">
                    {format(new Date(order.startDate), 'MMM d, yyyy')} to {format(new Date(order.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Rental Amount</span>
                  <span className="font-medium">₹{order.totalAmount}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Refundable Deposit</span>
                  <span className="font-medium">₹{order.depositAmount}</span>
                </li>
                {order.penaltyAmount > 0 && (
                  <li className="flex justify-between text-destructive">
                    <span>Late Penalty</span>
                    <span className="font-medium">₹{order.penaltyAmount}</span>
                  </li>
                )}
                {order.depositRefunded > 0 && (
                  <li className="flex justify-between text-green-600">
                    <span>Deposit Refunded</span>
                    <span className="font-medium">-₹{order.depositRefunded}</span>
                  </li>
                )}
                <li className="flex justify-between font-bold pt-4 border-t mt-4 text-base">
                  <span>Total Paid</span>
                  <span className="text-primary">₹{order.totalAmount + order.depositAmount}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {order.payments.length > 0 ? (
                <ul className="space-y-4">
                  {order.payments.map((payment) => (
                    <li key={payment.id} className="flex flex-col gap-1 rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {payment.method}
                        </span>
                        <span className="font-bold text-green-600">₹{payment.amount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{format(new Date(payment.paidAt), 'MMM d, yyyy h:mm a')}</span>
                        <span className="uppercase tracking-wider">{payment.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg text-muted-foreground">
                  <IndianRupee className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-sm">No payments recorded.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
