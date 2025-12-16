// src/pages/Checkout.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Checkout() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "40px auto",
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>預訂完成</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          您的商品已預訂成功，請依合作社規定的取貨時間與方式，到現場出示學號或 Face
          ID 進行取貨與扣款。
        </p>

        <Link to="/" className="btn primary">
          回商品頁繼續購物
        </Link>
      </div>
    </div>
  );
}