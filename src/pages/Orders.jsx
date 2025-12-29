// src/pages/Orders.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { fetchMyVerifiedOrders } from "../services/orders";
import { Timestamp } from "firebase/firestore";
import { NavLink } from "react-router-dom";

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${dd} ${hh}:${mm}`;
}

export default function Orders() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setErr("");
        if (!user?.uid) {
          if (!alive) return;
          setOrders([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const rows = await fetchMyVerifiedOrders(user.uid, { pageSize: 50 });
        if (!alive) return;
        setOrders(rows);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => (alive = false);
  }, [user?.uid]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [orders]
  );

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>消費紀錄</h1>
        <div className="muted" style={{ marginTop: 8 }}>
          顯示 <b>verified</b>（付款成功）。{" "}
          <NavLink to="/records">去看預訂紀錄</NavLink>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <div>
            <div className="muted">近 50 筆</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{orders.length} 筆</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted">合計消費</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>NT$ {totalSpent}</div>
          </div>
        </div>
      </Card>

      {!user && <Card><b>請先登入</b></Card>}
      {user && loading && <Card>載入中…</Card>}

      {user && !loading && err && (
        <Card>
          <div className="text-error" style={{ fontWeight: 800 }}>讀取失敗</div>
          <div className="muted" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{err}</div>
        </Card>
      )}

      {user && !loading && !err && orders.length === 0 && (
        <Card><div style={{ fontWeight: 800 }}>目前沒有付款成功的消費紀錄</div></Card>
      )}

      {user && !loading && !err && orders.map((o) => (
        <Card key={o.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900 }}>
                訂單：{o.id.slice(0, 6).toUpperCase()}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {fmtTime(o.verifiedAt || o.createdAt)} ・ 狀態：{o.status} ・ 方式：{o.method || "-"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted">消費金額</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                NT$ {Number(o.total) || 0}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}