import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

function toDate(ts) {
  return ts?.toDate ? ts.toDate() : null;
}

function fmtTime(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleString("zh-TW") : "-";
}

function isSameMonth(d, now) {
  return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function Dashboard() {
  const { user, student } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        if (!user?.uid) {
          if (alive) {
            setRecent([]);
            setLoading(false);
          }
          return;
        }

        // 讀取 orders/{userId=*}；不排序避免觸發複合索引，回來後前端自己依 createdAt 排序
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), limit(80));

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 前端排序：createdAt 新到舊
        list.sort((a, b) => {
          const da = toDate(a.createdAt)?.getTime() ?? 0;
          const dbb = toDate(b.createdAt)?.getTime() ?? 0;
          return dbb - da;
        });

        if (alive) setRecent(list.slice(0, 10));
      } catch (e) {
        const msg = e?.message || String(e);
        if (alive) setError(msg.includes("index") ? "需要索引（Index）或稍後再試" : msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const stats = useMemo(() => {
    const now = new Date();
    const all = recent; // 這裡用 recent 做統計（已經是最新一批資料）

    const monthTotal = all.reduce((sum, r) => {
      const d = toDate(r.createdAt);
      if (!isSameMonth(d, now)) return sum;
      return sum + Number(r.total ?? 0);
    }, 0);

    const monthCount = all.reduce((cnt, r) => {
      const d = toDate(r.createdAt);
      return cnt + (isSameMonth(d, now) ? 1 : 0);
    }, 0);

    return { monthTotal, monthCount };
  }, [recent]);

  return (
    <>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <Card>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>首頁</h1>
            <div className="muted" style={{ fontSize: 14 }}>
              已登入：{user?.email || "-"}
              {typeof student?.balance === "number" && (
                <span style={{ marginLeft: 10 }}>｜ 錢包餘額：NT$ {student.balance}</span>
              )}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Card>
              <div className="muted" style={{ fontSize: 13 }}>本月消費金額</div>
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>
                NT$ {stats.monthTotal}
              </div>
            </Card>

            <Card>
              <div className="muted" style={{ fontSize: 13 }}>本月消費筆數</div>
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>
                {stats.monthCount} 筆
              </div>
            </Card>

            <Card>
              <div className="muted" style={{ fontSize: 13 }}>最近同步狀態</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 10 }}>
                {loading ? "載入中…" : error ? "讀取失敗" : "正常"}
              </div>
              {error && <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{error}</div>}
            </Card>
          </div>

          <Card>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>最近消費</h2>

            {loading && <div className="muted">載入中…</div>}

            {!loading && !error && recent.length === 0 && (
              <div className="muted">尚無消費紀錄。</div>
            )}

            {!loading && !error && recent.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {recent.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 14,
                      padding: 12,
                      background: "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        NT$ {Number(r.total ?? 0)}
                        <span className="muted" style={{ fontWeight: 700, marginLeft: 8 }}>
                          {r.method ? `(${r.method})` : ""}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {fmtTime(r.createdAt)} ｜ 狀態：{r.status ?? "-"}
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {Array.isArray(r.items) ? `${r.items.length} 項` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
