'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@prisma/client';

export type CartItem = {
  id: string; // unique local ID for the cart item (e.g. timestamp)
  product: Product;
  startDate: string; // ISO string
  endDate: string; // ISO string
  quantity: number;
  days: number;
  rentalTotal: number;
  depositTotal: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartDeposit: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setItems((prev) => [...prev, newItem]);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, item) => sum + item.rentalTotal, 0);
  const cartDeposit = items.reduce((sum, item) => sum + item.depositTotal, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, clearCart, cartTotal, cartDeposit }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
