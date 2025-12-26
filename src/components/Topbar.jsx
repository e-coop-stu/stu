import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, student, logout } = useAuth();
  const loc = useLocation();

  const Nav = ({ to, label }) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          textDecoration: "none",
          color: active ? "#111" : "#666",
          background: active ? "#eef2ff" : "transparent",
          fontWeight: 800,
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Nav to="/" label="首頁" />
          <Nav to="/shop" label="商品頁" />
          <Nav to="/cart" label="購物車" />
          <Nav to="/face-enroll" label="Face ID" />
          <Nav to="/records" label="消費紀錄" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: "#666", fontWeight: 700 }}>{user?.email || ""}</div>

          {typeof student?.balance === "number" && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "#eaffea",
                border: "1px solid #b7f3b7",
                fontWeight: 900,
              }}
            >
              餘額：$ {student.balance}
            </div>
          )}

          <button className="btn ghost" onClick={logout}>
            登出
          </button>
        </div>
      </div>
    </div>
  );
}
