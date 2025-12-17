// src/services/store.js
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  getDocs,
  where,
  limit,
} from "firebase/firestore";

/** 商品監聽（商品頁用） */
export function listenProducts(onData, onError) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}

/** 心跳（不影響主要功能） */
export function startInventoryHeartbeat(userOrId, intervalMs = 30_000) {
  let userId = userOrId;
  if (userId && typeof userId === "object") userId = userId.uid;
  if (typeof userId !== "string") userId = userId ? String(userId) : "";
  if (!userId) return () => {};

  const ref = doc(db, "heartbeats", userId);
  const ping = () =>
    setDoc(ref, { userId, at: serverTimestamp(), type: "student" }, { merge: true }).catch(() => {});
  ping();
  const t = setInterval(ping, intervalMs);
  return () => clearInterval(t);
}

/** 產生 6 碼取貨碼（去掉易混淆字元） */
function genPickupCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * ✅ 預訂購物車（會產生短取貨碼 pickupCode）
 * - 餘額不足：throw "餘額不足"
 * - 先讀完再寫（避免 transaction 讀寫順序錯誤）
 * - 用 pickup_codes/{code} 鎖碼，避免撞碼
 * - 注意：reserved 不在這裡加（加入購物車時已經處理）
 */
export async function reserveCart({ userId, items }) {
  if (!userId) throw new Error("缺少使用者");
  if (!items?.length) throw new Error("購物車是空的");

  const orderRef = doc(collection(db, "orders"));
  const studentRef = doc(db, "students", userId);

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000); // 1 小時

  // 把 items 正規化
  const normItems = items
    .map((i) => ({
      productId: i.product?.id,
      name: i.product?.name || "",
      price: Number(i.product?.price || 0),
      qty: Number(i.qty || 0),
    }))
    .filter((x) => x.productId && x.qty > 0);

  if (!normItems.length) throw new Error("購物車是空的");

  const total = normItems.reduce((s, x) => s + x.price * x.qty, 0);

  // 取貨碼可能會撞（機率很低），用重試避免
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const pickupCode = genPickupCode(6);
    const codeRef = doc(db, "pickup_codes", pickupCode);

    try {
      await runTransaction(db, async (tx) => {
        // ========= READ PHASE：先把所有要讀的都讀完 =========
        const [studentSnap, codeSnap] = await Promise.all([tx.get(studentRef), tx.get(codeRef)]);
        if (!studentSnap.exists()) throw new Error("學生資料不存在");
        if (codeSnap.exists()) throw new Error("取貨碼已被使用，請重試");

        const student = studentSnap.data();
        const balance = Number(student.balance ?? 0);
        if (balance < total) throw new Error("餘額不足");

        // 先讀完所有商品
        const productSnaps = [];
        for (const it of normItems) {
          const productRef = doc(db, "products", it.productId);
          const pSnap = await tx.get(productRef);
          if (!pSnap.exists()) throw new Error("商品不存在");
          productSnaps.push({ it, productRef, pSnap });
        }

        // 檢查庫存（仍是 read phase）
        for (const { it, pSnap } of productSnaps) {
          const p = pSnap.data();
          const stock = Number(p.stock ?? 0);
          if (stock < it.qty) throw new Error(`商品「${p.name || it.productId}」庫存不足`);
        }

        // ========= WRITE PHASE：開始寫 =========

        // 1) 鎖取貨碼
        tx.set(codeRef, {
          orderId: orderRef.id,
          createdAt: serverTimestamp(),
          expiresAt,
        });

        // 2) 扣庫存、退 reserved
        for (const { it, productRef, pSnap } of productSnaps) {
          const p = pSnap.data();
          const stock = Number(p.stock ?? 0);
          const reserved = Number(p.reserved ?? 0);

          tx.update(productRef, {
            stock: stock - it.qty,
            reserved: Math.max(0, reserved - it.qty),
            updatedAt: serverTimestamp(),
          });
        }

        // 3) 扣餘額
        tx.update(studentRef, {
          balance: balance - total,
          updatedAt: serverTimestamp(),
        });

        // 4) 建立訂單（含 pickupCode）
        tx.set(orderRef, {
          userId,
          pickupCode, // ✅ 短編號
          items: normItems.map((x) => ({
            productId: x.productId, // 統一用 productId
            name: x.name,
            price: x.price,
            qty: x.qty,
            subtotal: x.price * x.qty,
          })),
          total,
          status: "reserved",
          createdAt: serverTimestamp(),
          expiresAt,
        });
      });

      // transaction 成功：回傳給前端顯示
      return {
        orderId: orderRef.id,
        pickupCode,
        expiresAt: expiresAt.toDate(),
      };
    } catch (e) {
      const msg = e?.message || String(e);
      lastErr = e;

      // 撞碼 → 重試；其他錯直接丟
      if (msg.includes("取貨碼已被使用")) continue;
      throw e;
    }
  }

  throw new Error("取貨碼產生失敗，請稍後再試");
}

/**
 * ✅ 合作社端：用取貨碼查訂單
 * 回傳 {id, ...data} 或 null
 */
export async function getOrderByPickupCode(pickupCode) {
  const code = String(pickupCode || "").trim().toUpperCase();
  if (!code) throw new Error("請輸入取貨碼");

  const q = query(collection(db, "orders"), where("pickupCode", "==", code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}