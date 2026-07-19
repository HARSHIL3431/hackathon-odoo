import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { ArrowRight, ShoppingCart, Search, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdminAccess();

  const orders = await prisma.rentalOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      product: true,
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Registry</h1>
          <p className="text-muted-foreground mt-1">Global view of all platform transactions and orders.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-slide-up delay-100">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by ID, customer or product..." 
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {orders.length} orders
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Orders Found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">There are currently no orders in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Order ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Amount</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="bg-card hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-primary hover:underline">
                        {order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {order.customer.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="truncate max-w-[200px]">{order.product.name}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-right tabular-nums">
                      ₹{order.totalAmount + order.depositAmount + order.penaltyAmount - order.depositRefunded}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge state={order.state} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 text-xs font-medium transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
