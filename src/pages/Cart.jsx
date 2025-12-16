// src/pages/Cart.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { reserveCart } from "../services/store";

export default function Cart() {
  const { items, add, dec, remove, clear, total } = useCart();
  const { user, student } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!items.length) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>購物車</h1>
        <p className="muted">購物車是空的，回到商品頁逛逛吧！</p>
      </div>
    );
  }

  async function onReserve() {
    if (!user) {
      setMsg("請先登入");
      return;
    }
    setBusy(true);
    setMsg("");

    try {
      const res = await reserveCart({
        userId: user.uid,
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
      });
      clear();
      setMsg(
        `✅ 已預訂成功！單號 ${res.orderId}（保留至 ${res.expiresAt.toLocaleString()}）`
      );
    } catch (e) {
      setMsg("預訂失敗：" + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* 標題 + 使用者資訊 */}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>購物車</h1>
        {user && (
          <div className="muted" style={{ fontSize: 14 }}>
            已登入：{user.email}
            {typeof student?.balance === "number" && (
              <span style={{ marginLeft: 8 }}>
                | 錢包餘額：NT$ {student.balance}
              </span>
            )}
          </div>
        )}
      </header>

      {/* 品項列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((i) => (
          <div
            key={i.product.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{i.product.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                單價：NT$ {i.product.price}
              </div>
            </div>

            {/* 數量調整 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 120,
                justifyContent: "center",
              }}
            >
              <button
                className="btn ghost"
                onClick={() => dec(i.product.id)}
                aria-label="decrease"
              >
                -
              </button>
              <span style={{ minWidth: 24, textAlign: "center" }}>{i.qty}</span>
              <button
                className="btn ghost"
                onClick={() => add(i.product)}
                aria-label="increase"
              >
                +
              </button>
            </div>

            {/* 小計 */}
            <div style={{ width: 90, textAlign: "right", fontWeight: 600 }}>
              NT$ {i.product.price * i.qty}
            </div>

            {/* 移除 */}
            <button
              className="btn ghost"
              onClick={() => remove(i.product.id)}
              style={{ marginLeft: 4 }}
            >
              移除
            </button>
          </div>
        ))}
      </div>

      {/* 總計 + 按鈕 */}
      <div
        className="card"
        style={{
          marginTop: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            總計：NT$ {total}
          </div>
          {typeof student?.balance === "number" && (
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              預訂後會由合作社端扣款，請確認錢包餘額足夠。
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={clear}>
            清空
          </button>
          <button
            className="btn primary"
            onClick={onReserve}
            disabled={busy}
          >
            {busy ? "處理中…" : "預訂"}
          </button>
        </div>
      </div>

      {/* 訊息 */}
      {msg && (
        <div style={{ marginTop: 12 }} className="muted">
          {msg}
        </div>
      )}
    </div>
  );
}