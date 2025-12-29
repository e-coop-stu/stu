// src/pages/Records.jsx
import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { fetchMyReservedOrders } from "../services/orders";
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

export default function Records() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user?.uid) {
        setList([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const rows = await fetchMyReservedOrders(user.uid, { pageSize: 50 });
        if (!alive) return;
        setList(rows);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "載入失敗");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => (alive = false);
  }, [user?.uid]);

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>預訂紀錄</h1>
        <div className="muted" style={{ marginTop: 8 }}>
          這裡顯示 <b>預訂成功（reserved）</b> 但尚未付款的訂單。
          <span style={{ marginLeft: 8 }}>
            <NavLink to="/orders">去看消費紀錄</NavLink>
          </span>
        </div>
      </Card>

      {!user && (
        <Card>
          <div style={{ fontWeight: 800 }}>請先登入</div>
        </Card>
      )}

      {user && loading && <Card>載入中…</Card>}

      {user && !loading && err && (
        <Card>
          <div className="text-error" style={{ fontWeight: 800 }}>
            讀取失敗
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            {err}
          </div>
        </Card>
      )}

      {user && !loading && !err && list.length === 0 && (
        <Card>
          <div style={{ fontWeight: 800 }}>目前沒有預訂紀錄</div>
        </Card>
      )}

      {user &&
        !loading &&
        !err &&
        list.map((o) => (
          <Card key={o.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900 }}>
                  預訂 #{o.id.slice(0, 6).toUpperCase()}
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {fmtTime(o.createdAt)} ・ 狀態：{o.status || "reserved"} ・ 方式：
                  {o.paymentMethod || "-"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted">預訂金額</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  NT$ {Number(o.total) || 0}
                </div>
              </div>
            </div>

            {Array.isArray(o.items) && o.items.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ marginBottom: 6 }}>明細</div>
                {o.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}
                  >
                    <div>
                      {it.name || it.title || it.productName || "商品"}{" "}
                      <span className="muted">x{it.qty ?? it.count ?? 1}</span>
                    </div>
                    <div className="muted">NT$ {Number(it.price) || 0}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="muted" style={{ marginTop: 10 }}>
              docId：{o.id}
            </div>
          </Card>
        ))}
    </div>
  );
}