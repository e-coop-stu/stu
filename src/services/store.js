
import { db } from "../lib/firebase";
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp,
  runTransaction, Timestamp, where, getDocs, updateDoc
} from "firebase/firestore";

export function listenProducts(cb) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}

export async function reserveCart({ userId, items }) {
  if (!items?.length) throw new Error("購物車是空的");
  const expiresAt = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000); // +1h

  await Promise.all(items.map(i => runTransaction(db, async (tx) => {
    const ref = doc(db, "products", i.product.id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("商品不存在：" + i.product.name);
    const data = snap.data();
    const need = i.qty ?? 1;
    if ((data.stock ?? 0) < need) throw new Error(`庫存不足：${data.name}`);
    tx.update(ref, { stock: (data.stock ?? 0) - need });
  })));

  const orderRef = await addDoc(collection(db, "orders"), {
    userId, status: "reserved",
    items: items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty })),
    createdAt: serverTimestamp(),
    expiresAt
  });

  return { orderId: orderRef.id, expiresAt: expiresAt.toDate() };
}

export function startInventoryHeartbeat(intervalMs = 60_000) {
  async function sweep() {
    try {
      const now = Timestamp.now();
      const q = query(collection(db, "orders"),
        where("status", "==", "reserved"),
        where("expiresAt", "<=", now)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const o = d.data();
        for (const it of (o.items || [])) {
          await runTransaction(db, async (tx) => {
            const ref = doc(db, "products", it.id);
            const s = await tx.get(ref);
            if (!s.exists()) return;
            const cur = s.data();
            tx.update(ref, { stock: (cur.stock ?? 0) + (it.qty ?? 1) });
          });
        }
        await updateDoc(doc(db, "orders", d.id), { status: "expired" });
      }
    } catch (e) {
      console.error("[heartbeat] error", e);
    }
  }
  sweep();
  const t = setInterval(sweep, intervalMs);
  return () => clearInterval(t);
}
