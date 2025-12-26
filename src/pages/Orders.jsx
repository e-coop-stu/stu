import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

function fmtTime(ts) {
  if (!ts?.toDate) return "-";
  return ts.toDate().toLocaleString("zh-TW");
}

export default function Orders() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const projectId = db?.app?.options?.projectId || "-";
  const authDomain = db?.app?.options?.authDomain || "-";
  const uid = user?.uid || "-";
  const email = user?.email || "-";

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      setRows([]);

      try {
        if (!user?.uid) {
          if (alive) setLoading(false);
          return;
        }

        // 不用 orderBy，避免需要建立複合索引；資料回來後再前端排序
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), limit(100));

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        list.sort((a, b) => {
          const ta = a?.createdAt?.toMillis?.() ?? 0;
          const tb = b?.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

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

          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Firebase：{projectId} ｜ {authDomain}
            <br />
            登入：{email}
            <br />
            uid：{uid}
          </div>

          {loading && <p className="muted">載入中…</p>}

          {error && (
            <div style={{ padding: 12, borderRadius: 12, background: "#fff3f3" }}>
              <b>讀取失敗：</b> {error}
            </div>
          )}

          {empty && (
            <div className="muted">
              尚無消費紀錄。<br />
              ✅ 如果 Firebase Console 有資料但這裡看不到，請確認文件的 userId 是否等於目前登入 UID。
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div style={{ display: "grid", gap: 14 }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: 14,
                    padding: 16,
                    background: "white",
                  }}
                >
                  <div style={{ marginBottom: 6, fontWeight: 800 }}>
                    消費金額：NT$ {r.total ?? 0}
                  </div>

                  <div className="muted" style={{ fontSize: 13 }}>
                    {fmtTime(r.createdAt)}
                  </div>

                  <div className="muted" style={{ fontSize: 13 }}>
                    狀態：{r.status ?? "-"} ｜ 方式：{r.method ?? "-"}
                  </div>

                  {Array.isArray(r.items) && r.items.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                        明細
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {r.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                              {it.name ?? it.productId ?? "商品"}{" "}
                              <span className="muted">x{it.qty ?? 1}</span>
                            </div>
                            <div className="muted">
                              NT${" "}
                              {it.lineTotal ?? Number(it.price ?? 0) * Number(it.qty ?? 1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                    docId：{r.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
