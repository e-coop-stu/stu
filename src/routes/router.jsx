// src/routes/router.jsx
import React from "react";
import { createHashRouter } from "react-router-dom";

import Layout from "../components/Layout";

import Dashboard from "../pages/Dashboard";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import FaceEnroll from "../pages/FaceEnroll";
import Login from "../pages/Login";
import Orders from "../pages/Orders";
import Records from "../pages/Records";

export const router = createHashRouter([
  // 🔐 登入頁（不走 Layout）
  {
    path: "/login",
    element: <Login />,
  },

  // 🌐 主要頁面（有導覽列）
  {
    path: "/",
    element: <Layout />,
    children: [
      // 首頁
      { index: true, element: <Dashboard /> },

      // 功能頁
      { path: "shop", element: <Shop /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "face-enroll", element: <FaceEnroll /> },

      // 訂單
      { path: "orders", element: <Orders /> },   // 已付款（verified）
      { path: "records", element: <Records /> }, // 預訂（pending）
    ],
  },
]);