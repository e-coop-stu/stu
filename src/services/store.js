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
  getDocs,
  where,
  limit,
} from "firebase/firestore";

/* =========================
   商品監聽
========================= */
export function listenProducts(onData, onError) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}

/* =========================
   工具：取貨碼
========================= */
function genPickupCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* =========================
   ✅ 預訂購物車（未付款）
   - 會建立 orders（reserved）
   - 🔥 同步建立 checkout_requests（reserved）
========================= */
export async function reserveCart({ userId, items }) {
  if (!userId) throw new Error("缺少使用者");
  if (!items?.length) throw new Error("購物車是空的");

  const orderRef = doc(collection(db, "orders"));
  const recordRef = doc(collection(db, "checkout_requests"));
  const studentRef = doc(db, "students", userId);

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000); // 1 小時

  const normItems = items
    .map((i) => ({
      productId: i.product?.id,
      name: i.product?.name || "",
      price: Number(i.product?.price || 0),
      qty: Number(i.qty || 0),
      subtotal: Number(i.product?.price || 0) * Number(i.qty || 0),
    }))
    .filter((x) => x.productId && x.qty > 0);

  if (!normItems.length) throw new Error("購物車是空的");

  const total = normItems.reduce((s, x) => s + x.subtotal, 0);

  for (let attempt = 0; attempt < 5; attempt++) {
    const pickupCode = genPickupCode();

    try {
      await runTransaction(db, async (tx) => {
        const studentSnap = await tx.get(studentRef);
        if (!studentSnap.exists()) throw new Error("學生不存在");

        // ✅ 建立 orders（預訂）
        tx.set(orderRef, {
          userId,
          pickupCode,
          items: normItems,
          total,
          status: "reserved",
          createdAt: serverTimestamp(),
          expiresAt,
        });

        // 🔥 建立 checkout_requests（預訂紀錄頁要用）
        tx.set(recordRef, {
          who: userId,                 // 你目前 records / orders 就是用 who
          orderId: orderRef.id,
          pickupCode,
          items: normItems,
          total,
          status: "reserved",          // 👈 關鍵
          method: "Web",
          source: "stu_web",
          createdAt: serverTimestamp(),
          expiresAt,
        });
      });

      return {
        orderId: orderRef.id,
        pickupCode,
        expiresAt: expiresAt.toDate(),
      };
    } catch (e) {
      if (String(e.message).includes("取貨碼")) continue;
      throw e;
    }
  }

  throw new Error("取貨碼產生失敗");
}

/* =========================
   合作社端：用取貨碼查訂單
========================= */
export async function getOrderByPickupCode(pickupCode) {
  const q = query(
    collection(db, "orders"),
    where("pickupCode", "==", pickupCode),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}