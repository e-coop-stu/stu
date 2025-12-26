import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

function fmtTime(ts) {
  if (!ts?.toDate) return "-";
  return ts.toDate().toLocaleString("zh-TW");
}

export default function Records() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!user?.uid) {
          setRows([]);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (alive) setRows(list);
      } catch (e) {
        if (alive) setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [user?.uid]);

  const empty = !loading && !error && rows.length === 0;

  return (
    <>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <Card>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>消費紀錄</h1>
          <p className="muted" style={{ marginBottom: 16 }}>
            顯示你在合作社的預訂/消費紀錄（orders）。
          </p>

          {loading && <p className="muted">載入中…</p>}
          {error && <p style={{ color: "red" }}>讀取失敗：{error}</p>}
          {empty && <p className="muted">尚無消費紀錄。</p>}

          {!loading && !error && rows.length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {rows.map((o) => (
                <div
                  key={o.id}
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: 14,
                    padding: 14,
                    background: "white",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        消費金額：NT$ {o.total ?? 0}
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {fmtTime(o.createdAt)}
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        狀態：{o.status ?? "-"}　｜　取貨碼：{o.pickupCode ?? "-"}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>明細</div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {o.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                              {it.name ?? it.productId ?? "商品"}{" "}
                              <span className="muted">x{it.qty ?? 1}</span>
                            </div>
                            <div className="muted">
                              NT$ {it.subtotal ?? (Number(it.price ?? 0) * Number(it.qty ?? 1))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
