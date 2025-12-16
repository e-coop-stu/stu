// src/components/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, student, logout } = useAuth();

  const linkStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
  };

  const active = ({ isActive }) =>
    isActive
      ? { ...linkStyle, background: "#f1f5f9", fontWeight: 600 }
      : linkStyle;

  return (
    <div>
      <header className="nav">
        {/* 左側導覽 */}
        <NavLink to="/" style={active}>
          首頁
        </NavLink>
        <NavLink to="/shop" style={active}>
          商品頁
        </NavLink>
        <NavLink to="/cart" style={active}>
          購物車
        </NavLink>
        <NavLink to="/face-enroll" style={active}>
          Face ID
        </NavLink>
        <NavLink to="/orders" style={active}>
          消費紀錄
        </NavLink>

        {/* 右側使用者資訊 */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {user ? (
            <>
              <span className="muted" style={{ fontSize: 13 }}>
                {user.email}
              </span>
              {student && (
                <span
                  className="muted"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#ecfdf3",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                  }}
                >
                  餘額：$ {student.balance ?? 0}
                </span>
              )}
              <button className="btn ghost" onClick={logout}>
                登出
              </button>
            </>
          ) : (
            <NavLink to="/login" style={active}>
              登入
            </NavLink>
          )}
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}