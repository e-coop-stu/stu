// src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        console.warn("load orders error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  if (!user) {
    return <div style={{ padding: 20 }}>請先登入。</div>;
  }

  return (
    <div className="card" style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>消費紀錄</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        顯示你在合作社的消費歷史。合作社端或刷臉系統完成扣款後，可以在這裡看到紀錄。
      </p>

      {loading ? (
        <div style={{ marginTop: 16 }}>載入中…</div>
      ) : orders.length === 0 ? (
        <div style={{ marginTop: 16 }} className="muted">
          尚無消費紀錄。
        </div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {orders.map((o) => {
            const time =
              o.createdAt?.toDate?.().toLocaleString?.() || "";
            const itemsText =
              o.items?.map?.((it) => it.name).join("、") || "購物";
            const total = o.total ?? 0;
            const method =
              o.payMethod === "face"
                ? "Face ID"
                : o.payMethod || "未知";

            return (
              <div
                key={o.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{ fontWeight: 500, fontSize: 14 }}
                  >
                    {itemsText}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#dc2626",
                      fontSize: 14,
                    }}
                  >
                    -$ {total}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  <span>{time}</span>
                  <span>付款方式：{method}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}