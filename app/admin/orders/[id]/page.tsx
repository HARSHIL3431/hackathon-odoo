import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, CreditCard, CalendarDays, User, Package, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import OrderTimeline from '@/components/OrderTimeline';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;

  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      payments: {
        orderBy: { paidAt: 'desc' }
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" asChild>
            <Link href="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 bg-muted/30 p-6 rounded-xl border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master ERP Record</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">ID: {order.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <a href={`/api/orders/${order.id}/pdf?type=admin`} target="_blank" download>
              <Download className="mr-2 h-4 w-4" />
              Download Full Audit Record
            </a>
          </Button>
          <OrderStatusBadge state={order.state} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-slide-up delay-100">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Name</span>
                  <span className="font-medium text-base">{order.customer.name}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Email</span>
                  <span className="font-medium">{order.customer.email}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Customer ID</span>
                  <span className="font-mono text-xs p-1 bg-muted rounded">{order.customerId}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-slide-up delay-200">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Product
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Name</span>
                  <span className="font-medium text-base">{order.product.name}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Quantity Rented</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Product ID</span>
                  <span className="font-mono text-xs p-1 bg-muted rounded">{order.productId}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-slide-up delay-300">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-primary" />
                Financial Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Rental Amount</dt>
                    <dd className="font-medium">₹{order.totalAmount}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Deposit Collected</dt>
                    <dd className="font-medium">₹{order.depositAmount}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Penalty Applied</dt>
                    <dd className="font-medium text-destructive">₹{order.penaltyAmount}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Deposit Refunded</dt>
                    <dd className="font-medium text-success">₹{order.depositRefunded}</dd>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <dt className="font-bold">Net Account Value</dt>
                    <dd className="font-bold text-lg text-primary">₹{order.totalAmount + order.depositAmount + order.penaltyAmount - order.depositRefunded}</dd>
                  </div>
                </dl>

                <div>
                  <h4 className="text-xs font-bold mb-4 uppercase tracking-wider text-muted-foreground">Payment Logs</h4>
                  {order.payments.length > 0 ? (
                    <div className="space-y-3">
                      {order.payments.map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border text-sm">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">{payment.method}</span>
                              <span className="text-xs text-muted-foreground">{format(payment.paidAt, 'dd MMM yy HH:mm')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-bold">₹{payment.amount}</span>
                            <span className={`text-[10px] font-bold uppercase ${payment.status === 'Success' ? 'text-green-600' : 'text-amber-600'}`}>{payment.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg text-center border">No payment logs found.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="animate-slide-up delay-400">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg border">
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">Start Time</span>
                <span className="font-medium block text-lg">{format(order.startDate, 'dd MMM yyyy')}</span>
                <span className="text-sm text-muted-foreground">{format(order.startDate, 'HH:mm:ss')}</span>
              </div>
              <div className="bg-muted/20 p-4 rounded-lg border">
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-1">End Time</span>
                <span className="font-medium block text-lg">{format(order.endDate, 'dd MMM yyyy')}</span>
                <span className="text-sm text-muted-foreground">{format(order.endDate, 'HH:mm:ss')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-20 animate-slide-up delay-500 shadow-md border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg">State Machine</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <OrderTimeline currentState={order.state} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
