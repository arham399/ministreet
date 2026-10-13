"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart/store";

export type CartDiscountQuote = {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number;
    discountName: string | null;
  }[];
  subtotal: number;
};

export function useCartDiscountQuote() {
  const items = useCartStore((state) => state.items);
  const requestBody = JSON.stringify({
    items: items.map(({ productId, quantity }) => ({ productId, quantity })),
  });
  const [quote, setQuote] = useState<CartDiscountQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setQuote(null);

    fetch("/api/discounts/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to calculate discounts.");
        return result as CartDiscountQuote;
      })
      .then((result) => {
        if (!controller.signal.aborted) setQuote(result);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Unable to calculate discounts.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [items.length, requestBody]);

  return { quote, error, loading };
}
