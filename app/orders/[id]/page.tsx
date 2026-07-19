import prisma from '@/lib/prisma';
import { requireCustomerAccess } from '@/lib/auth';
import { notFound } from 'next/navigation';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, CalendarDays, IndianRupee, CreditCard, Box, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import OrderTimeline from '@/components/OrderTimeline';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCustomerAccess();
  const { id } = await params;

  const order = await prisma.rentalOrder.findUnique({
    where: {
      id,
      customerId: user.userId,
    },
    include: {
      product: true,
      payments: {
        orderBy: { paidAt: 'desc' }
      },
    },
  });

  if (!order) return notFound();

  return (
    <div className="mx-auto max-w-5xl py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 bg-muted/30 p-6 rounded-xl border">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">#{order.id.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          {order.state !== 'Draft' && (
            <Button variant="outline" className="bg-background" asChild>
              <a href={`/api/orders/${order.id}/pdf?type=customer`} target="_blank" download>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </a>
            </Button>
          )}
          <OrderStatusBadge state={order.state} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content Area (Left 2 cols) */}
        <div className="md:col-span-2 space-y-8">
          <Card className="animate-slide-up delay-100 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Box className="h-5 w-5 text-primary" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="h-20 w-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl flex-shrink-0 border border-primary/20 shadow-sm">
                  {order.product.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl">{order.product.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{order.product.description}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-8 text-sm bg-muted/20 p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mb-1">Quantity</span>
                      <span className="font-medium text-lg">{order.quantity}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mb-1">Rental Duration</span>
                      <span className="font-medium flex items-center gap-1.5 text-foreground/90">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(order.startDate, 'dd MMM')} - {format(order.endDate, 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up delay-200 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-muted-foreground">Rental Rate ({order.quantity}x)</dt>
                  <dd className="font-medium text-foreground/90">₹{order.totalAmount}</dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-muted-foreground">Refundable Deposit</dt>
                  <dd className="font-medium text-foreground/90">₹{order.depositAmount}</dd>
                </div>
                {order.penaltyAmount > 0 && (
                  <div className="flex justify-between items-center text-sm text-destructive">
                    <dt>Late Fees / Penalties</dt>
                    <dd className="font-medium">₹{order.penaltyAmount}</dd>
                  </div>
                )}
                {order.depositRefunded > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <dt>Deposit Refunded</dt>
                    <dd className="font-medium">- ₹{order.depositRefunded}</dd>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t flex justify-between items-center bg-muted/10 -mx-6 px-6 pb-2">
                  <dt className="font-bold text-lg">Total Amount</dt>
                  <dd className="font-bold text-2xl text-primary">₹{order.totalAmount + order.depositAmount + order.penaltyAmount - order.depositRefunded}</dd>
                </div>
              </dl>

              {order.payments.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="text-xs font-bold mb-4 uppercase tracking-wider text-muted-foreground">Payment History</h4>
                  <div className="space-y-3">
                    {order.payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-3.5 rounded-lg bg-background border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{payment.method}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{format(payment.paidAt, 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-base font-bold">₹{payment.amount}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${payment.status === 'Success' ? 'text-green-600' : 'text-amber-600'}`}>{payment.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area (Right 1 col) */}
        <div className="md:col-span-1 space-y-6 animate-slide-up delay-300">
          <Card className="sticky top-20 shadow-md border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pl-4">
              <OrderTimeline currentState={order.state} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
