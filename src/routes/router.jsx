// src/routes/router.jsx
import React from "react";
import { createHashRouter } from "react-router-dom";

import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import Orders from "../pages/Orders"; // ✅ 消費紀錄頁
import Login from "../pages/Login";
import FaceEnroll from "../pages/FaceEnroll";
import { RequireAuth } from "../context/AuthContext";

export const router = createHashRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },

      { path: "shop", element: <Shop /> },

      {
        path: "cart",
        element: (
          <RequireAuth>
            <Cart />
          </RequireAuth>
        ),
      },

      // ✅ 原本的 /orders 仍然保留
      {
        path: "orders",
        element: (
          <RequireAuth>
            <Orders />
          </RequireAuth>
        ),
      },

      // ✅ 新增 /records 也指向同一頁，避免你 Topbar 點到 records 就 404
      {
        path: "records",
        element: (
          <RequireAuth>
            <Orders />
          </RequireAuth>
        ),
      },

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

  { path: "*", element: <div style={{ padding: 20 }}>404 找不到此頁</div> },
]);