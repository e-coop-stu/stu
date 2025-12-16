// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export default function Dashboard() {
  const { user, student } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [faceStatus, setFaceStatus] = useState("loading");

  useEffect(() => {
    if (!user) return;

    (async () => {
      // 最近三筆消費
      try {
        const q = query(
          collection(db, "orders"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const snap = await getDocs(q);
        setRecentOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        console.warn("load orders error:", e);
      }

      // Face ID 狀態
      try {
        const fq = query(
          collection(db, "face_enrollments"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const fsnap = await getDocs(fq);
        if (fsnap.empty) {
          setFaceStatus("none");
        } else {
          const doc = fsnap.docs[0].data();
          setFaceStatus(doc.status || "unknown");
        }
      } catch (e) {
        console.warn("load face status error:", e);
        setFaceStatus("unknown");
      }
    })();
  }, [user?.uid]);

  const balance = student?.balance ?? 0;
  const name = user?.email?.split("@")[0] || "同學";

  const faceStatusText = {
    none: "尚未註冊",
    pending: "待系統訓練中",
    ready: "已啟用，可使用 Face ID 付款",
    no_face: "照片無法辨識，請重新上傳",
    unknown: "狀態不明",
    loading: "載入中…",
  }[faceStatus] || "狀態不明";

  const faceStatusColor =
    faceStatus === "ready"
      ? "#16a34a"
      : faceStatus === "pending"
      ? "#eab308"
      : faceStatus === "no_face"
      ? "#dc2626"
      : "#6b7280";

  return (
    <div className="card" style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* 歡迎 + 餘額 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,2fr) minmax(0,1.4fr)",
          gap: 20,
          marginBottom: 12,
        }}
      >
        <div>
          <div className="muted" style={{ fontSize: 14 }}>
            歡迎回來，
          </div>
          <h1
            style={{
              margin: "4px 0 8px",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {name} 👋
          </h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
            這裡可以查看你的餘額、消費紀錄與 Face ID 狀態，並快速前往購物。
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link to="/shop" className="btn primary">
              前往商品頁
            </Link>
            <Link to="/orders" className="btn ghost">
              查看消費紀錄
            </Link>
          </div>
        </div>

        {/* 餘額卡片 */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background:
              "radial-gradient(circle at top left,#bbf7d0,#16a34a)",
            color: "#f9fafb",
            boxShadow: "0 18px 40px rgba(22,163,74,0.45)",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.9 }}>目前餘額</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 6,
              marginBottom: 12,
            }}
          >
            $ {balance}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            若餘額不足，請至合作社櫃檯儲值。
          </div>
        </div>
      </div>

      {/* Face ID 狀態 + 最近消費 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1.6fr)",
          gap: 20,
          marginTop: 10,
        }}
      >
        {/* Face ID 卡片 */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
              fontSize: 15,
            }}
          >
            Face ID 狀態
          </div>
          <div
            style={{
              fontSize: 13,
              color: faceStatusColor,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {faceStatusText}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            上傳清楚的正臉照片，系統訓練完成後即可在實體合作社使用
            Face ID 付款。
          </p>
          <Link to="/face-enroll" className="btn ghost">
            管理 Face ID
          </Link>
        </div>

        {/* 最近消費 */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
              fontSize: 15,
            }}
          >
            最近消費
          </div>
          {recentOrders.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>
              尚無消費紀錄，快去逛逛商品吧！
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {recentOrders.map((o) => {
                const time =
                  o.createdAt?.toDate?.().toLocaleString?.() || "";
                const total = o.total ?? 0;
                const firstName =
                  o.items?.[0]?.name || "購物紀錄";
                const count =
                  (o.items?.length || 0) > 1
                    ? `等 ${o.items.length} 項商品`
                    : "";
                return (
                  <div
                    key={o.id}
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 2,
                      }}
                    >
                      {firstName} {count}
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
                      <span>-$ {total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <Link
              to="/orders"
              className="btn ghost"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              查看全部紀錄
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}