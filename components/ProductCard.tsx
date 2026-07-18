import React from 'react';
import Link from 'next/link';
import { Product } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Package } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const inStock = product.stockQty > 0;

  return (
    <Card className="flex flex-col group transition-all duration-200 hover:shadow-md hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
            <CardDescription className="line-clamp-2 min-h-[2.5rem]">
              {product.description || 'No description available.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-col space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">₹{product.rentalPricePerDay}</span>
              <span className="text-xs text-muted-foreground">per day</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">₹{product.depositAmount}</span>
              <span className="text-xs text-muted-foreground">Deposit</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={inStock ? "success" : "destructive"} className="gap-1">
              {inStock ? (
                <>
                  <Package className="w-3 h-3" />
                  In Stock ({product.stockQty})
                </>
              ) : (
                "Out of Stock"
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t bg-muted/20">
        <Button asChild className="w-full" variant={inStock ? "default" : "secondary"}>
          <Link href={`/products/${product.id}`}>
            {inStock ? "Rent Now" : "View Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
