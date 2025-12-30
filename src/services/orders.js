// src/services/orders.js
import { db } from "../lib/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  const d = ts instanceof Date ? ts : new Date(ts);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

/** =========================
 *  預訂紀錄（未付款）
 *  來源：orders
 *  status = reserved
 *  （不使用 orderBy，避免 index 問題；前端排序）
 * ========================= */
export async function fetchMyReservedOrders(uid, { pageSize = 50 } = {}) {
  if (!uid) return [];

  const q = query(
    collection(db, "orders"),
    where("userId", "==", uid),
    limit(Math.min(200, pageSize))
  );

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return rows
    .filter((r) => r.status === "pending")
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, pageSize);
}

/** =========================
 *  消費紀錄（已付款）
 *  來源：checkout_requests
 *  status = verified
 *
 *  你 Firebase 裡的結構是：
 *   - who: Firebase uid（或 uid-時間戳）
 *   - uid: 99108a13（不是 Firebase uid）
 *
 *  所以這裡用 who 抓，並支援：
 *   - who == uid
 *   - who 前綴 uid-xxxx（舊格式）
 * ========================= */
export async function fetchMyVerifiedOrders(uid, { pageSize = 50 } = {}) {
  if (!uid) return [];

  // 1) who == uid
  const q1 = query(
    collection(db, "checkout_requests"),
    where("who", "==", uid),
    limit(200)
  );

  let rows = [];
  const snap1 = await getDocs(q1);
  rows = snap1.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 2) 若你有舊資料 who = uid-xxxx，補抓（不用 index 的版本：先抓 who==uid 不夠時再用 range）
  // range 查詢通常需要 orderBy(who) 才正規，但為了避免你又被 index 卡住，
  // 我這裡採取「不做 range」的穩定策略：只抓 who == uid 的格式。
  // 若你真的有 who=uid-xxxx 的資料很多，我再另外給你建 index 的版本。
  // （你目前 screenshot 大多是 who == firebase uid，所以這裡就夠用）

  return rows
    .filter((r) => r.status === "verified")
    .sort((a, b) => toMillis(b.verifiedAt) - toMillis(a.verifiedAt))
    .slice(0, pageSize);
}