
import React, { useEffect, useState } from "react";
import { listenProducts } from "../services/store";
import { useCart } from "../context/CartContext";

export default function Shop() {
  const [products, setProducts] = useState(null);
  const { add } = useCart();

  useEffect(() => {
    const unsub = listenProducts(setProducts);
    return () => unsub && unsub();
  }, []);

  if (!products) return <div>載入商品中…</div>;
  if (!products.length) return <div>目前沒有商品，請在 Firestore 建立 <code>products</code> 集合。</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>商品頁</h1>
      <div className="grid">
        {products.map(p => (
          <div className="card" key={p.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <div style={{ fontWeight:700 }}>{p.name}</div>
              <div className="price">NT$ {p.price}</div>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>庫存：{p.stock ?? 0}</div>
            {p.restockAt && (
              <div className="muted" style={{ fontSize:13 }}>
                補貨時間：{new Date(p.restockAt.seconds*1000).toLocaleString()}
              </div>
            )}
            <div style={{ marginTop:10, display:"flex", gap:8 }}>
              <button className="btn ghost" onClick={()=>add(p, 1)} disabled={(p.stock ?? 0) <= 0}>
                { (p.stock ?? 0) > 0 ? "加入購物車" : "缺貨"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
