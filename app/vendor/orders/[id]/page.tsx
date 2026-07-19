import { requireVendorAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { format, differenceInHours } from 'date-fns';
import { OrderState } from '@prisma/client';
import { TransitionButtons } from './TransitionButtons';
import { Download, ArrowLeft, Package, User, CalendarDays, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import OrderTimeline from '@/components/OrderTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

function getDurationString(start: Date, end: Date) {
  const hours = differenceInHours(end, start);
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  const parts = [];
  if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : '0 Hours';
}

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
      payments: true,
    },
  });

  if (!order) return notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 animate-fade-in">
      <div className="mb-4">
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" asChild>
          <Link href="/vendor/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendor Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 bg-muted/30 p-6 rounded-xl border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Order Management
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            #{order.id.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-background" asChild>
            <a href={`/api/orders/${order.id}/pdf?type=vendor`} target="_blank" download>
              <Download className="mr-2 h-4 w-4" />
              Download Rental Agreement
            </a>
          </Button>
          <OrderStatusBadge state={order.state} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-slide-up delay-100">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Equipment & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {order.product.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{order.product.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded-md font-medium text-foreground">Qty: {order.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">Start Date</span>
                  </div>
                  <p className="font-medium text-lg">{format(order.startDate, 'dd MMM yyyy')}</p>
                  <p className="text-sm text-muted-foreground">{format(order.startDate, 'hh:mm a')}</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">End Date</span>
                  </div>
                  <p className="font-medium text-lg">{format(order.endDate, 'dd MMM yyyy')}</p>
                  <p className="text-sm text-muted-foreground">{format(order.endDate, 'hh:mm a')}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/5 text-primary rounded-lg text-center font-medium border border-primary/10">
                Duration: {getDurationString(order.startDate, order.endDate)}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up delay-200">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1 text-xs uppercase font-bold tracking-wider">Name</dt>
                  <dd className="font-medium text-base">{order.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1 text-xs uppercase font-bold tracking-wider">Email</dt>
                  <dd className="font-medium text-base">{order.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1 text-xs uppercase font-bold tracking-wider">Customer ID</dt>
                  <dd className="font-mono text-xs p-1.5 bg-muted rounded inline-block">{order.customerId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card className="animate-slide-up delay-300">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-primary" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-muted-foreground">Base Rental</dt>
                  <dd className="font-medium">₹{order.totalAmount}</dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-muted-foreground">Security Deposit</dt>
                  <dd className="font-medium">₹{order.depositAmount}</dd>
                </div>
                {order.penaltyAmount > 0 && (
                  <div className="flex justify-between items-center text-sm text-destructive">
                    <dt>Late Fees / Damages</dt>
                    <dd className="font-medium">₹{order.penaltyAmount}</dd>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t flex justify-between items-center">
                  <dt className="font-bold">Total Expected</dt>
                  <dd className="font-bold text-lg text-primary">₹{order.totalAmount + order.depositAmount + order.penaltyAmount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-20 shadow-md border-primary/10 animate-slide-up delay-400">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <OrderTimeline currentState={order.state} />
            </CardContent>
            {/* Render transition buttons if the state allows it */}
            {(order.state === OrderState.Paid || 
              order.state === OrderState.PickedUp || 
              order.state === OrderState.Active || 
              order.state === OrderState.Returned) && (
              <div className="p-6 pt-0 border-t mt-4 bg-muted/10">
                <h4 className="text-sm font-semibold mb-4 mt-4 text-center">Take Action</h4>
                <TransitionButtons orderId={order.id} currentState={order.state} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
