// src/routes/router.jsx
import React from "react";
import { createHashRouter } from "react-router-dom";

import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import Orders from "../pages/Orders";
import Login from "../pages/Login";
import FaceEnroll from "../pages/FaceEnroll";
import { RequireAuth } from "../context/AuthContext";

export const router = createHashRouter([
  // 登入頁（不包在 Layout 裡）
  {
    path: "/login",
    element: <Login />,
  },

  // 主框架
  {
    path: "/",
    element: <Layout />,
    children: [
      // 首頁 → 儀表板，需要登入
      {
        index: true,
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },

      // 商品頁（可不登入就看）
      {
        path: "shop",
        element: <Shop />,
      },

      // 購物車（需登入）
      {
        path: "cart",
        element: (
          <RequireAuth>
            <Cart />
          </RequireAuth>
        ),
      },

      // 消費紀錄（需登入）
      {
        path: "orders",
        element: (
          <RequireAuth>
            <Orders />
          </RequireAuth>
        ),
      },

      // Face ID 註冊（需登入）
      {
        path: "face-enroll",
        element: (
          <RequireAuth>
            <FaceEnroll />
          </RequireAuth>
        ),
      },
    ],
  },

  // 404
  {
    path: "*",
    element: <div style={{ padding: 20 }}>404 找不到此頁</div>,
  },
]);