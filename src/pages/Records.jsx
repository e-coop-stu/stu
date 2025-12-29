import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { fetchMyReservedOrders } from "../services/orders";
import { Timestamp } from "firebase/firestore";
import { NavLink } from "react-router-dom";

function fmt(ts) {
  if (!ts) return "-";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function Records() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      setRows([]);
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchMyReservedOrders(user.uid);
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setErr(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, [user?.uid]);

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>預訂紀錄</h1>
        <div className="muted" style={{ marginTop: 8 }}>
          顯示 <b>reserved</b>（預訂成功、未付款）
          ・ <NavLink to="/orders">查看消費紀錄</NavLink>
        </div>
      </Card>

      {!user && <Card><b>請先登入</b></Card>}
      {loading && <Card>載入中…</Card>}

      {!loading && err && (
        <Card>
          <div className="text-error">讀取失敗</div>
          <pre>{err}</pre>
        </Card>
      )}

      {!loading && !err && rows.length === 0 && (
        <Card>
          <b>目前沒有預訂紀錄</b>
        </Card>
      )}

      {!loading && !err && rows.map(o => (
        <Card key={o.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900 }}>
                取貨碼：{o.pickupCode}
              </div>
              <div className="muted">
                建立時間：{fmt(o.createdAt)}
              </div>
              <div className="muted">
                保留至：{fmt(o.expiresAt)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted">預訂金額</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                NT$ {o.total}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}