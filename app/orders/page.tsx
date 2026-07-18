import prisma from '@/lib/prisma';
import { requireCustomerAccess, AuthError } from '@/lib/auth';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { RentalOrder, Product } from '@prisma/client';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { PackageSearch, ChevronRight, CalendarDays } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

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
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Orders</h1>
        <p className="mt-2 text-muted-foreground">View and track your rental history.</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <PackageSearch className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You haven&apos;t rented any equipment yet.
          </p>
          <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: RentalOrder & { product: Product }) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block group">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        {order.product.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-semibold group-hover:text-primary transition-colors">
                          {order.product.name} {order.quantity > 1 ? <span className="text-muted-foreground ml-1">(x{order.quantity})</span> : null}
                        </p>
                        <div className="flex flex-col text-sm text-muted-foreground mt-1 gap-1">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {format(new Date(order.startDate), 'dd MMM yy, HH:mm')} &rarr; {format(new Date(order.endDate), 'dd MMM yy, HH:mm')}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground/80 pl-6">
                            {getDurationString(new Date(order.startDate), new Date(order.endDate))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right flex flex-col items-end">
                        <span className="text-lg font-bold">₹{order.totalAmount + order.depositAmount}</span>
                        <OrderStatusBadge state={order.state} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
