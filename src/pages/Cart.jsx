
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { reserveCart } from "../services/store";

export default function Cart() {
  const { items, add, dec, remove, clear, total } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!items.length) return <div>購物車是空的，回到首頁逛逛吧！</div>;

  async function onReserve() {
    if (!user) { setMsg("請先登入"); return; }
    setBusy(true); setMsg("");
    try {
      const res = await reserveCart({
        userId: user.uid,
        items: items.map(i => ({ product: i.product, qty: i.qty })),
      });
      clear();
      setMsg(`✅ 已預訂成功！單號 ${res.orderId}（保留至 ${res.expiresAt.toLocaleString()}）`);
    } catch (e) {
      setMsg("預訂失敗：" + (e?.message || String(e)));
    } finally { setBusy(false); }
  }

  return (
    <div>
      {items.map(i => (
        <div key={i.product.id} className="card" style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <div style={{ flex:1, fontWeight:600 }}>{i.product.name}</div>
          <div>NT$ {i.product.price}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="btn ghost" onClick={()=>dec(i.product.id)}>-</button>
            <span>{i.qty}</span>
            <button className="btn ghost" onClick={()=>add(i.product)}>+</button>
          </div>
          <button className="btn ghost" onClick={()=>remove(i.product.id)}>移除</button>
        </div>
      ))}
      <div style={{ textAlign:"right", fontWeight:700, marginTop:8 }}>總計：NT$ {total}</div>
      <div style={{ textAlign:"right", marginTop:8, display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn ghost" onClick={clear}>清空</button>
        <button className="btn primary" onClick={onReserve} disabled={busy}>{busy ? "處理中…" : "預訂"}</button>
      </div>
      {msg && <div style={{ marginTop:12 }}>{msg}</div>}
    </div>
  );
}
