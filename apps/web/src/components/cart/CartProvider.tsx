"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_QTY_PER_TOY, type CartLine } from "@toyshop/shared";

// The cart lives in this browser (localStorage), so shoppers can fill it before
// logging in. Prices and stock are always re-checked on the server at checkout.
const STORAGE_KEY = "toyshop-cart-v1";

type CartState = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}

function read(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => typeof line?.productId === "string" && Number(line.quantity) > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: Math.min(Math.floor(Number(line.quantity)), MAX_QTY_PER_TOY),
      }));
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage may be unavailable (private mode); the cart then lasts for this visit.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
    // Keep several open tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((change: (current: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const next = change(current).filter((line) => line.quantity > 0);
      write(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (productId: string, quantity = 1) =>
      update((current) => {
        const existing = current.find((line) => line.productId === productId);
        if (!existing) return [...current, { productId, quantity: Math.min(quantity, MAX_QTY_PER_TOY) }];
        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QTY_PER_TOY) }
            : line,
        );
      }),
    [update],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      update((current) =>
        current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, Math.min(Math.floor(quantity), MAX_QTY_PER_TOY)) }
            : line,
        ),
      ),
    [update],
  );

  const remove = useCallback(
    (productId: string) => update((current) => current.filter((line) => line.productId !== productId)),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [ready, lines, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
