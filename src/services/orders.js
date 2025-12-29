// src/services/orders.js
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export async function fetchMyPaidOrders(uid, { pageSize = 50 } = {}) {
  if (!uid) return [];
  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    where("status", "==", "paid"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchMyReservedOrders(uid, { pageSize = 50 } = {}) {
  if (!uid) return [];
  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    where("status", "==", "reserved"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}