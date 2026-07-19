import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AddToCartForm from '@/components/AddToCartForm';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const session = await getSession();
  const userRole = session?.role;
  const inStock = product.stockQty > 0;

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Link>
      </div>
      
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <Badge variant={inStock ? "success" : "destructive"}>
                {inStock ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> In Stock</span>
                ) : (
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Out of Stock</span>
                )}
              </Badge>
              {inStock && <span className="text-sm text-muted-foreground">{product.stockQty} available</span>}
            </div>
          </div>
          
          <div className="prose prose-sm sm:prose-base dark:prose-invert">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description || 'No detailed description available.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Rental Rate</span>
              <span className="text-xl font-bold tracking-tight">₹{product.rentalPricePerDay} <span className="text-sm font-normal text-muted-foreground">/ day</span></span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Refundable Deposit</span>
              <span className="text-xl font-bold tracking-tight">₹{product.depositAmount}</span>
            </div>
            <div className="flex flex-col space-y-1 col-span-2 pt-4 border-t mt-2">
              <span className="text-sm text-muted-foreground">Late Fee Policy</span>
              <span className="text-sm font-medium text-destructive">₹{product.lateFeePerDay} charged per late day</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!userRole && (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm text-center">
              <h3 className="text-lg font-semibold">Ready to rent?</h3>
              <p className="text-sm text-muted-foreground">Log in to check availability, pick your dates, and add this equipment to your cart.</p>
              <Button asChild size="lg" className="w-full">
                <Link href="/login">Log in to Rent</Link>
              </Button>
            </div>
          )}
          
          {userRole === 'CUSTOMER' && (
            inStock ? (
              <AddToCartForm product={product} />
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/50 p-8 text-center">
                <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Currently Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  This item is out of stock. Please check back later when inventory is replenished.
                </p>
              </div>
            )
          )}

          {userRole === 'VENDOR' && (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Vendor Actions</h3>
              <Button asChild className="w-full" size="lg">
                <Link href="/vendor/orders?filter=upcoming">
                  View Rental Requests
                </Link>
              </Button>
              <Button asChild className="w-full" variant="secondary" size="lg">
                <Link href="/vendor/orders?filter=ready">
                  View Reservations
                </Link>
              </Button>
            </div>
          )}

          {userRole === 'ADMIN' && (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Admin Actions</h3>
              <Button asChild className="w-full" size="lg">
                <Link href={`/admin/products/${product.id}`}>
                  Edit Product
                </Link>
              </Button>
              <Button asChild className="w-full" variant="secondary" size="lg">
                <Link href="/admin/products">
                  View Reservations
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline" size="lg">
                <Link href="/admin/products">
                  Manage Inventory
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
