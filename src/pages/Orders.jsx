// src/pages/Orders.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { fetchMyPaidOrders } from "../services/orders";
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
      if (!user?.uid) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const list = await fetchMyPaidOrders(user.uid, { pageSize: 50 });
        if (!alive) return;
        setOrders(list);
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
    return () => {
      alive = false;
    };
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
          這裡只顯示 <b>付款成功（paid）</b> 的訂單。
          <span style={{ marginLeft: 8 }}>
            <NavLink to="/records">去看預訂紀錄</NavLink>
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <div>
            <div className="muted">近 50 筆</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{orders.length} 筆</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted">合計消費</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>${totalSpent}</div>
          </div>
        </div>
      </Card>

      {!user && (
        <Card>
          <div style={{ fontWeight: 800 }}>請先登入</div>
          <div className="muted" style={{ marginTop: 6 }}>
            登入後才可以看到你的消費紀錄。
          </div>
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

      {user && !loading && !err && orders.length === 0 && (
        <Card>
          <div style={{ fontWeight: 800 }}>目前沒有付款成功的消費紀錄</div>
          <div className="muted" style={{ marginTop: 6 }}>
            如果你只有預訂成功，請到 <NavLink to="/records">預訂紀錄</NavLink> 查看。
          </div>
        </Card>
      )}

      {user &&
        !loading &&
        !err &&
        orders.map((o) => (
          <Card key={o.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900 }}>
                  訂單 #{o.id.slice(0, 6).toUpperCase()}
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {fmtTime(o.createdAt)} ・ 狀態：{o.status || "unknown"} ・ 方式：
                  {o.paymentMethod || "-"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted">消費金額</div>
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