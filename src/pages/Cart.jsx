// src/pages/Cart.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { reserveCart } from "../services/store";

export default function Cart() {
  const { items, add, dec, remove, clearCart, total } = useCart();
  const { user, student } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onReserve() {
    if (!user) {
      setMsg({ type: "error", title: "請先登入", lines: [] });
      return;
    }

    if (typeof student?.balance === "number" && student.balance < total) {
      setMsg({
        type: "error",
        title: "❌ 餘額不足",
        lines: [
          `目前餘額：NT$ ${student.balance}`,
          `需要金額：NT$ ${total}`,
          "請先儲值後再預訂",
        ],
      });
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const res = await reserveCart({
        userId: user.uid,
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
      });

      setMsg({
        type: "success",
        title: "✅ 已成功預定商品",
        lines: [
          `取貨碼：${res.pickupCode}`,
          "請於一小時內領取",
          "完成扣款後，消費紀錄才會出現",
        ],
        extra: `單號：${res.orderId}　｜　保留至：${res.expiresAt.toLocaleString()}`,
      });

      await clearCart();
    } catch (e) {
      const m = e?.message || String(e);
      setMsg({
        type: "error",
        title: m.includes("餘額不足") ? "❌ 餘額不足" : "預訂失敗",
        lines: [m.includes("餘額不足") ? "請先儲值後再預訂" : m],
      });
    } finally {
      setBusy(false);
    }
  }

  const MsgBox = () =>
    msg ? (
      <div
        className="card"
        style={{
          marginTop: 12,
          padding: 12,
          lineHeight: 1.7,
          border:
            msg.type === "success"
              ? "1px solid rgba(34,197,94,.35)"
              : "1px solid rgba(239,68,68,.35)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{msg.title}</div>
        {msg.lines?.map((t, idx) => (
          <div key={idx} className="muted">
            {t}
          </div>
        ))}
        {msg.extra && (
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            {msg.extra}
          </div>
        )}
      </div>
    ) : null;

  if (!items.length) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 12, textAlign: "center" }}>購物車</h1>
        <MsgBox />
        {!msg && (
          <p className="muted" style={{ textAlign: "center" }}>
            購物車是空的，回到商品頁逛逛吧！
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>購物車</h1>
        {user && (
          <div className="muted" style={{ fontSize: 14 }}>
            已登入：{user.email}
            {typeof student?.balance === "number" && (
              <span style={{ marginLeft: 8 }}>| 錢包餘額：NT$ {student.balance}</span>
            )}
          </div>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((i) => (
          <div
            key={i.product.id}
            className="card"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{i.product.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                單價：NT$ {i.product.price}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120, justifyContent: "center" }}>
              <button className="btn ghost" onClick={() => dec(i.product.id)} disabled={busy}>-</button>
              <span style={{ minWidth: 24, textAlign: "center" }}>{i.qty}</span>
              <button className="btn ghost" onClick={() => add(i.product)} disabled={busy}>+</button>
            </div>

            <div style={{ width: 90, textAlign: "right", fontWeight: 600 }}>
              NT$ {i.product.price * i.qty}
            </div>

            <button className="btn ghost" onClick={() => remove(i.product.id)} disabled={busy}>
              移除
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>總計：NT$ {total}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            ✅ 扣款成功後，才會出現在「消費紀錄」。
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={clearCart} disabled={busy}>清空</button>
          <button className="btn primary" onClick={onReserve} disabled={busy}>
            {busy ? "處理中…" : "預訂"}
          </button>
        </div>
      </div>

      <MsgBox />
    </div>
  );
}