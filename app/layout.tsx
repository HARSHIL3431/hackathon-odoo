import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { Role } from "@prisma/client";

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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <CartProvider>
          <header className="bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between items-center">
                <div className="flex items-center">
                  <Link href="/" className="text-xl font-bold text-blue-600">
                    RentalApp
                  </Link>
                  {session?.role === Role.ADMIN && (
                    <Link href="/admin/dashboard" className="ml-8 text-sm font-medium text-gray-700 hover:text-blue-600">
                      Admin Dashboard
                    </Link>
                  )}
                </div>
                <div className="flex items-center space-x-6">
                  <CartBadge />
                  {session ? (
                    <div className="flex items-center space-x-4 border-l pl-6">
                      <span className="text-sm text-gray-500">Welcome, {session.name}</span>
                      <LogoutButton />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 border-l pl-6">
                      <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                        Login
                      </Link>
                      <Link href="/register" className="text-sm font-medium rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
