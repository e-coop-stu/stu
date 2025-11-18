
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const link = { padding: "8px 10px", borderRadius: 8, textDecoration: "none" };
  const active = ({ isActive }) => (isActive ? { ...link, background: "#f1f5f9" } : link);
  return (
    <div>
      <header className="nav">
        <NavLink to="/" style={active}>商品頁</NavLink>
        <NavLink to="/cart" style={active}>購物車</NavLink>
        <NavLink to="/face-enroll" style={active}>上傳 Face ID</NavLink>
        <div style={{ marginLeft: "auto" }}>
          {user ? (
            <>
              <span className="muted" style={{ marginRight: 10 }}>{user.email}</span>
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
