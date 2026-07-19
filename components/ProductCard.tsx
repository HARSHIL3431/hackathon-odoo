import React from 'react';
import Link from 'next/link';
import { Product } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Package, ArrowRight } from 'lucide-react';

export default function ProductCard({ product, userRole, index = 0 }: { product: Product; userRole?: string; index?: number }) {
  const inStock = product.stockQty > 0;
  
  // Calculate animation delay for stagger effect
  const delayClass = `delay-${(index % 5) * 100}`;

  return (
    <Card className={`flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 animate-slide-up ${delayClass} overflow-hidden`}>
      {/* Visual Image Placeholder */}
      <div className="relative w-full h-48 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center overflow-hidden border-b group-hover:from-primary/10 group-hover:to-primary/20 transition-colors duration-500">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {product.category && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-white/20 shadow-sm">
              {product.category}
            </Badge>
          )}
        </div>
        <Package className="w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
            </div>
            <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1 text-sm leading-relaxed">
              {product.description || 'No description available.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-end justify-between bg-muted/30 p-3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Rental Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-primary">₹{product.rentalPricePerDay}</span>
                <span className="text-xs text-muted-foreground font-medium">/day</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Deposit</span>
              <span className="text-sm font-semibold">₹{product.depositAmount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={inStock ? "success" : "destructive"} className="gap-1.5 py-1 px-3">
              {inStock ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse-slow"></span>
                  In Stock ({product.stockQty})
                </>
              ) : (
                "Out of Stock"
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t bg-muted/10 flex flex-col gap-3 pb-6">
        {!userRole && (
          <Button asChild className="w-full group/btn" variant={inStock ? "default" : "secondary"}>
            <Link href="/login">
              {inStock ? "Rent Now" : "View Details"}
              {inStock && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />}
            </Link>
          </Button>
        )}
        
        {userRole === 'CUSTOMER' && (
          <Button asChild className="w-full group/btn" variant={inStock ? "default" : "secondary"}>
            <Link href={`/products/${product.id}`}>
              {inStock ? "Rent Now" : "View Details"}
              {inStock && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />}
            </Link>
          </Button>
        )}

        {userRole === 'VENDOR' && (
          <div className="grid grid-cols-2 w-full gap-2">
            <Button asChild className="w-full text-xs h-9 px-2" variant="default">
              <Link href="/vendor/orders?filter=upcoming">Requests</Link>
            </Button>
            <Button asChild className="w-full text-xs h-9 px-2" variant="secondary">
              <Link href="/vendor/orders?filter=ready">Reservations</Link>
            </Button>
          </div>
        )}

        {userRole === 'ADMIN' && (
          <div className="grid grid-cols-2 w-full gap-2">
            <Button asChild className="w-full text-xs h-9 col-span-2" variant="default">
              <Link href={`/admin/products/${product.id}`}>Edit Product</Link>
            </Button>
            <Button asChild className="w-full text-xs h-9" variant="secondary">
              <Link href="/admin/products">Reservations</Link>
            </Button>
            <Button asChild className="w-full text-xs h-9" variant="outline">
              <Link href="/admin/products">Inventory</Link>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
