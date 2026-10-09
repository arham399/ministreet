"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  unitPrice: number;
  salePrice?: number | null;
  quantity: number;
  stockQuantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCount: () => number;
  getSubtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const qty = item.quantity ?? 1;
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const newQty = Math.min(
              existing.quantity + qty,
              item.stockQuantity || existing.stockQuantity
            );
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(qty, item.stockQuantity || qty),
              },
            ],
          };
        });
      },
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const q = Math.max(1, Math.min(quantity, i.stockQuantity || quantity));
              return { ...i, quantity: q };
            })
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
      getCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((s, i) => {
          const price =
            i.salePrice != null && i.salePrice < i.unitPrice
              ? i.salePrice
              : i.unitPrice;
          return s + price * i.quantity;
        }, 0),
    }),
    { name: "mini-street-cart" }
  )
);
