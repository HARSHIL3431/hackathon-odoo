import prisma from '@/lib/prisma';
import { requireCustomerAccess } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { ArrowRight, ShoppingBag, Package, CalendarDays, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersPage() {
  const user = await requireCustomerAccess();

  const orders = await prisma.rentalOrder.findMany({
    where: { customerId: user.userId },
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });

  return (
    <div className="mx-auto max-w-5xl py-8 animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Rentals</h1>
          <p className="text-muted-foreground mt-1">Manage your active rentals and view past orders.</p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/">Browse Catalog</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center animate-scale-in">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No rentals yet</h3>
          <p className="mb-8 text-muted-foreground max-w-sm">
            You haven't rented any equipment yet. Explore our catalog to find what you need.
          </p>
          <Button asChild size="lg">
            <Link href="/">Explore Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order, i) => {
            const delayClass = `delay-${(i % 5) * 100}`;
            
            return (
              <Card key={order.id} className={`flex flex-col group overflow-hidden animate-slide-up ${delayClass}`}>
                <CardHeader className="bg-muted/30 border-b p-5 relative">
                  <div className="absolute right-4 top-4">
                    <OrderStatusBadge state={order.state} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {order.product.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1 pr-16">{order.product.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Duration
                      </span>
                      <p className="text-sm font-medium">
                        {format(new Date(order.startDate), 'MMM d')} - {format(new Date(order.endDate), 'MMM d, yy')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" /> Quantity
                      </span>
                      <p className="text-sm font-medium">{order.quantity} Items</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5" /> Total
                    </span>
                    <span className="font-bold text-primary">
                      ₹{order.totalAmount + order.depositAmount + order.penaltyAmount - order.depositRefunded}
                    </span>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 border-t bg-muted/10">
                  <Button asChild variant="secondary" className="w-full group/btn">
                    <Link href={`/orders/${order.id}`}>
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
