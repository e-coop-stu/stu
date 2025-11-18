
import React, { createContext, useContext, useMemo, useState } from "react";

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{product, qty}]

  function add(product, qty = 1) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { product, qty }];
    });
  }
  function dec(productId, n = 1) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.product.id === productId);
      if (idx < 0) return prev;
      const next = [...prev];
      const q = next[idx].qty - n;
      if (q <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty: q };
      return next;
    });
  }
  function remove(productId) {
    setItems((prev) => prev.filter((x) => x.product.id !== productId));
  }
  function clear() { setItems([]); }

  const total = useMemo(() => items.reduce((s, i) => s + i.product.price * i.qty, 0), [items]);

  return (
    <Ctx.Provider value={{ items, add, dec, remove, clear, total }}>
      {children}
    </Ctx.Provider>
  );
}
