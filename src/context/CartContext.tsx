"use client";

import React, { createContext, useContext, useSyncExternalStore, useCallback } from "react";
import { Product } from "@/data/products";

export interface CartItem {
  id: string; // composite id: `${product.id}-${color}-${size}`
  product: Product;
  color: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, color: string, size: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "dompi_cart_v1";
const EMPTY_ITEMS: CartItem[] = [];

// External store object for React 19 compliance
const cartStore = {
  items: EMPTY_ITEMS,
  listeners: new Set<() => void>(),

  init() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.items = parsed;
          }
        }
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  },

  getSnapshot(): CartItem[] {
    return cartStore.items;
  },

  getServerSnapshot(): CartItem[] {
    return EMPTY_ITEMS;
  },

  subscribe(callback: () => void) {
    cartStore.listeners.add(callback);
    const onStorage = () => {
      cartStore.init();
      callback();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      cartStore.listeners.delete(callback);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  },

  set(newItems: CartItem[]) {
    cartStore.items = newItems;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      } catch (e) {
        console.error("Failed to save cart", e);
      }
    }
    cartStore.listeners.forEach((l) => l());
  },
};

// Initialize store once on module load
cartStore.init();

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );

  const addItem = useCallback(
    (product: Product, color: string, size: string, quantity = 1) => {
      const safeColor = color || (product.colors?.[0]?.name ?? "Standard");
      const safeSize = size || (product.sizes?.[0] ?? "M");
      const compositeId = `${product.id}-${safeColor}-${safeSize}`;

      const current = cartStore.items;
      const existingIndex = current.findIndex((item) => item.id === compositeId);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = [...current];
        const newQty = updated[existingIndex].quantity + quantity;
        const maxQty = product.stock || 99;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, maxQty),
        };
      } else {
        updated = [
          ...current,
          {
            id: compositeId,
            product,
            color: safeColor,
            size: safeSize,
            quantity: Math.min(quantity, product.stock || 99),
          },
        ];
      }

      cartStore.set(updated);
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    const updated = cartStore.items.filter((item) => item.id !== itemId);
    cartStore.set(updated);
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updated = cartStore.items.filter((item) => item.id !== itemId);
      cartStore.set(updated);
      return;
    }

    const updated = cartStore.items.map((item) => {
      if (item.id === itemId) {
        const maxStock = item.product.stock || 99;
        return {
          ...item,
          quantity: Math.min(newQuantity, maxStock),
        };
      }
      return item;
    });

    cartStore.set(updated);
  }, []);

  const clearCart = useCallback(() => {
    cartStore.set([]);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const shipping = items.length === 0 ? 0 : subtotal >= 2000 ? 0 : 100;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        total,
        isHydrated: true,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
