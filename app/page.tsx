import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { Product } from '@prisma/client';
import { PackageSearch, Search } from 'lucide-react';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const session = await getSession();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background border-b pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20 z-0"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-slide-up">
            Premium Equipment <br className="hidden sm:block" />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Ready When You Are
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up delay-100">
            Browse our extensive catalog of professional-grade equipment. Instant availability checking, transparent pricing, and seamless rentals.
          </p>
          
          <div className="mt-10 max-w-xl mx-auto relative animate-slide-up delay-200">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary sm:text-lg transition-all"
                placeholder="Search equipment by name or category..."
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded border">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center gap-2 animate-slide-up delay-300">
            <span className="text-sm text-muted-foreground py-1.5 px-2">Popular Categories:</span>
            {categories.slice(0, 5).map(category => (
              <button key={category} className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary/50 text-secondary-foreground hover:bg-secondary border border-transparent hover:border-border transition-all">
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight">Available Equipment</h2>
          <p className="text-sm text-muted-foreground font-medium">{products.length} items</p>
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-8 text-center animate-scale-in">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <PackageSearch className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">No equipment found</h3>
            <p className="mt-2 text-muted-foreground max-w-sm">
              We currently don't have any equipment available in the catalog. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: Product, index: number) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userRole={session?.role} 
                index={index} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
