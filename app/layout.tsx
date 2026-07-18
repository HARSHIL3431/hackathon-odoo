import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { Role } from "@prisma/client";
import { Package } from "lucide-react";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Management System",
  description: "Next.js App Router Rental System",
};

import { CartProvider } from "@/components/CartProvider";
import CartBadge from "@/components/CartBadge";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mr-4 hidden md:flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <Package className="h-6 w-6 text-primary" />
                  <span className="hidden font-bold sm:inline-block tracking-tight text-lg">
                    RentalApp
                  </span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                    Catalog
                  </Link>
                  {(session?.role === Role.VENDOR || session?.role === Role.ADMIN) && (
                    <Link href="/vendor/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                      Vendor
                    </Link>
                  )}
                  {session?.role === Role.ADMIN && (
                    <Link href="/admin/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                      Admin
                    </Link>
                  )}
                </nav>
              </div>

              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  {/* Future search could go here */}
                </div>
                <nav className="flex items-center space-x-4">
                  <CartBadge />
                  
                  {session && (session.role === Role.CUSTOMER || session.role === Role.VENDOR || session.role === Role.ADMIN) && (
                    <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      My Orders
                    </Link>
                  )}
                  
                  {session ? (
                    <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                      <span className="text-sm text-muted-foreground font-medium">{session.name}</span>
                      <LogoutButton />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                      <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Login
                      </Link>
                      <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                        Register
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full flex flex-col">{children}</main>
          <Toaster position="top-right" />
        </CartProvider>
      </body>
    </html>
  );
}
