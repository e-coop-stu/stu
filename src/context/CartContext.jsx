// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [items, setItems] = useState([]); // [{ product:{id,name,price,...}, qty }]
  const [loading, setLoading] = useState(true);

  // 追蹤登入狀態
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // 監聽 Firestore 的購物車
  useEffect(() => {
    setItems([]);
    setLoading(true);

    if (!uid) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, "carts", uid, "items");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            product: {
              id: d.id,
              name: data.name,
              price: data.price,
            },
            qty: Number(data.qty || 0),
          };
        });
        setItems(list.filter((x) => x.qty > 0));
        setLoading(false);
      },
      (err) => {
        console.error("cart snapshot error:", err);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.product.price || 0) * Number(i.qty || 0), 0),
    [items]
  );

  // ===== Firebase 版本的操作 =====

  async function add(product) {
    if (!uid) throw new Error("請先登入");
    if (!product?.id) throw new Error("商品缺少 id");

    const productRef = doc(db, "products", product.id);
    const cartItemRef = doc(db, "carts", uid, "items", product.id);

    await runTransaction(db, async (tx) => {
      const pSnap = await tx.get(productRef);
      if (!pSnap.exists()) throw new Error("商品不存在");

      const p = pSnap.data();
      const stock = Number(p.stock ?? 0);
      const reserved = Number(p.reserved ?? 0);
      const available = stock - reserved;

      if (available <= 0) throw new Error("庫存不足");

      const cSnap = await tx.get(cartItemRef);
      const oldQty = cSnap.exists() ? Number(cSnap.data().qty ?? 0) : 0;

      tx.set(
        cartItemRef,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty: oldQty + 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      tx.update(productRef, {
        reserved: reserved + 1,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async function dec(productId) {
    if (!uid) throw new Error("請先登入");
    if (!productId) return;

    const productRef = doc(db, "products", productId);
    const cartItemRef = doc(db, "carts", uid, "items", productId);

    await runTransaction(db, async (tx) => {
      const pSnap = await tx.get(productRef);
      const cSnap = await tx.get(cartItemRef);

      if (!pSnap.exists()) throw new Error("商品不存在");
      if (!cSnap.exists()) return;

      const p = pSnap.data();
      const reserved = Number(p.reserved ?? 0);

      const oldQty = Number(cSnap.data().qty ?? 0);
      const newQty = oldQty - 1;

      if (newQty <= 0) {
        tx.delete(cartItemRef);
      } else {
        tx.update(cartItemRef, { qty: newQty, updatedAt: serverTimestamp() });
      }

      tx.update(productRef, {
        reserved: Math.max(0, reserved - 1),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async function remove(productId) {
    if (!uid) throw new Error("請先登入");
    if (!productId) return;

    const productRef = doc(db, "products", productId);
    const cartItemRef = doc(db, "carts", uid, "items", productId);

    await runTransaction(db, async (tx) => {
      const pSnap = await tx.get(productRef);
      const cSnap = await tx.get(cartItemRef);

      if (!pSnap.exists()) throw new Error("商品不存在");
      if (!cSnap.exists()) return;

      const p = pSnap.data();
      const reserved = Number(p.reserved ?? 0);

      const qty = Number(cSnap.data().qty ?? 0);

      tx.delete(cartItemRef);
      tx.update(productRef, {
        reserved: Math.max(0, reserved - qty),
        updatedAt: serverTimestamp(),
      });
    });
  }

  // 清空：把購物車每個品項 qty 退回 reserved，並刪除 items
  async function clearCart() {
    if (!uid) throw new Error("請先登入");

    const itemsCol = collection(db, "carts", uid, "items");
    const snap = await getDocs(itemsCol);
    if (snap.empty) return;

    // 用 batch 刪購物車，reserved 回退用 transaction（避免 reserved 不準）
    // 這裡用「逐筆 transaction」最穩，因為每個 product 的 reserved 要讀最新值
    for (const d of snap.docs) {
      const data = d.data();
      const productId = d.id;
      const qty = Number(data.qty || 0);
      if (qty <= 0) {
        // 直接刪
        const batch = writeBatch(db);
        batch.delete(doc(db, "carts", uid, "items", productId));
        await batch.commit();
        continue;
      }

      const productRef = doc(db, "products", productId);
      const cartItemRef = doc(db, "carts", uid, "items", productId);

      await runTransaction(db, async (tx) => {
        const pSnap = await tx.get(productRef);
        const cSnap = await tx.get(cartItemRef);
        if (!pSnap.exists()) return;
        if (!cSnap.exists()) return;

        const p = pSnap.data();
        const reserved = Number(p.reserved ?? 0);
        const realQty = Number(cSnap.data().qty ?? 0);

        tx.delete(cartItemRef);
        tx.update(productRef, {
          reserved: Math.max(0, reserved - realQty),
          updatedAt: serverTimestamp(),
        });
      });
    }
  }

  const value = {
    items,
    total,
    loading,
    add,
    dec,
    remove,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}