import { requireVendorAccess, AuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Link from 'next/link';
import { RentalOrder, Product, User, OrderState } from '@prisma/client';
import { startOfDay, endOfDay, format, differenceInHours } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Eye, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

type OrderWithRelations = RentalOrder & { product: Product; customer: User };

function getDurationString(start: Date, end: Date) {
  const hours = differenceInHours(end, start);
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  const parts = [];
  if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : '0 Hours';
}

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
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied (403)</h1>
          <p className="mt-2 text-muted-foreground">Vendor access is required to view this dashboard.</p>
        </div>
      );
    }
    throw error;
  }

  const { filter } = await searchParams;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Build filter conditions exactly mirroring Dashboard logic
  let whereClause: any = {};
  const rentedStates = [OrderState.PickedUp, OrderState.Active];

  if (filter === 'upcoming') {
    whereClause = {
      state: OrderState.Paid,
      startDate: { gt: now },
    };
  } else if (filter === 'ready') {
    whereClause = {
      state: OrderState.Paid,
      startDate: { lte: now },
    };
  } else if (filter === 'active') {
    whereClause = {
      state: { in: rentedStates },
      endDate: { gte: now },
    };
  } else if (filter === 'overdue') {
    whereClause = {
      state: { in: rentedStates },
      endDate: { lt: now },
    };
  } else if (filter === 'completed') {
    whereClause = {
      state: OrderState.Settled,
    };
  }

  const orders = await prisma.rentalOrder.findMany({
    where: whereClause,
    include: { product: true, customer: true },
    orderBy: { createdAt: 'desc' },
  });

  const filters = [
    { label: 'All', value: '' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Ready for Pickup', value: 'ready' },
    { label: 'Active', value: 'active' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Completed', value: 'completed' },
  ];

  let emptyMessage = "No orders found.";
  if (filter === 'upcoming') emptyMessage = "No upcoming bookings.";
  else if (filter === 'ready') emptyMessage = "No pickups scheduled.";
  else if (filter === 'active') emptyMessage = "No active rentals.";
  else if (filter === 'overdue') emptyMessage = "No overdue rentals.";
  else if (filter === 'completed') emptyMessage = "No completed rentals.";

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-2">Manage customer rental orders and their statuses.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 rounded-lg border bg-muted/30 p-1 w-max">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/vendor/orders?filter=${f.value}` : '/vendor/orders'}
            className={`flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
              (filter || '') === f.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No orders found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: OrderWithRelations) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{order.customer.name}</TableCell>
                    <TableCell>
                      {order.product.name} {order.quantity > 1 ? <span className="text-muted-foreground ml-1">(x{order.quantity})</span> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div>{format(new Date(order.startDate), 'dd MMM yyyy, hh:mm a')}</div>
                      <div>↓</div>
                      <div>{format(new Date(order.endDate), 'dd MMM yyyy, hh:mm a')}</div>
                      <div className="font-semibold text-foreground mt-1">
                        {getDurationString(new Date(order.startDate), new Date(order.endDate))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{order.totalAmount + order.depositAmount}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge state={order.state} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendor/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
