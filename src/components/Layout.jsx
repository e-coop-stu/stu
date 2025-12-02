import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  const link = { 
    padding: "8px 10px", 
    borderRadius: 8, 
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 500
  };

  const active = ({ isActive }) =>
    isActive
      ? { ...link, background: "#f1f5f9" }
      : link;

  return (
    <div>
      <header className="nav" style={{ display: "flex", gap: 12, padding: 12 }}>
        {/* 左側導覽列 */}
        <NavLink to="/" style={active}>商品頁</NavLink>
        <NavLink to="/cart" style={active}>購物車</NavLink>

        {/* ⭐ 新增的 Face ID 註冊按鈕 */}
        <NavLink to="/face-enroll" style={active}>上傳 Face ID</NavLink>

        {/* 右側（登入 / 登出） */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span className="muted">{user.email}</span>
              <button className="btn ghost" onClick={logout}>登出</button>
            </>
          ) : (
            <NavLink to="/login" style={active}>登入</NavLink>
          )}
        </div>
      </header>

      {/* 頁面內容渲染區 */}
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}