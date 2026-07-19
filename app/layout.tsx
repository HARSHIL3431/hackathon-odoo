import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogOut, Package, Shield, LayoutDashboard } from "lucide-react";
import { Role } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";
import { CartProvider } from "@/components/CartProvider";
import CartBadge from "@/components/CartBadge";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rental ERP | Odoo Style",
  description: "Enterprise Equipment Rental Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} antialiased min-h-full flex flex-col bg-background text-foreground`}
      >
        <CartProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all">
            <div className="container mx-auto flex h-16 max-w-7xl items-center px-4 md:px-6">
              <Link href="/" className="flex items-center gap-2 group mr-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform shadow-sm">
                  <Package className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden sm:inline-block">
                  Rental ERP
                </span>
              </Link>

              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link href="/" className="transition-colors hover:text-primary text-muted-foreground">
                  Catalog
                </Link>
                {(session?.role === Role.VENDOR || session?.role === Role.ADMIN) && (
                  <Link href="/vendor/dashboard" className="transition-colors hover:text-primary text-muted-foreground flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> Vendor
                  </Link>
                )}
                {session?.role === Role.ADMIN && (
                  <Link href="/admin/dashboard" className="transition-colors hover:text-primary text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> Admin
                  </Link>
                )}
              </nav>

              <div className="flex flex-1 items-center justify-end space-x-4 ml-auto">
                {/* Cart is ONLY shown for customers */}
                {session?.role === Role.CUSTOMER && <CartBadge />}

                {session && (
                  <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
                    My Orders
                  </Link>
                )}

                {session ? (
                  <div className="flex items-center space-x-4 pl-4 sm:border-l border-border/50">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-sm font-semibold">{session.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">{session.role}</span>
                    </div>
                    <LogoutButton />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild className="hidden sm:inline-flex hover:bg-muted font-medium">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild className="shadow-sm hover:shadow transition-all hover:-translate-y-0.5 font-medium">
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 w-full bg-background/50">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
