// src/components/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, student, logout } = useAuth();

  const link = {
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
  };

  const active = ({ isActive }) =>
    isActive ? { ...link, background: "#f1f5f9" } : link;

  return (
    <div>
      <header className="nav">

        {/* 🔹 主選單 */}
        <NavLink to="/" style={active}>商品頁</NavLink>
        <NavLink to="/cart" style={active}>購物車</NavLink>

        {/* 🔹 Face ID 註冊頁 */}
        <NavLink to="/face-enroll" style={active}>上傳 Face ID</NavLink>

        {/* 🔹 右側使用者資訊 */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              {/* 使用者 Email */}
              <span className="muted">{user.email}</span>

              {/* 🔹 顯示餘額 */}
              {student && (
                <span className="muted" style={{ fontWeight: 600 }}>
                  餘額：${student.balance}
                </span>
              )}

              {/* 登出按鈕 */}
              <button className="btn ghost" onClick={logout}>登出</button>
            </>
          ) : (
            <NavLink to="/login" style={active}>登入</NavLink>
          )}
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}