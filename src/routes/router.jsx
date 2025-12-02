// src/routes/router.jsx
import React from "react";
import { createHashRouter } from "react-router-dom";

import Layout from "../components/Layout";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import FaceEnroll from "../pages/FaceEnroll";
import { RequireAuth } from "../context/AuthContext";

export const router = createHashRouter([
  // 登入頁（不放在 Layout）
  { 
    path: "/login", 
    element: <Login /> 
  },

  // 主框架（Layout 內含選單 / header）
  {
    path: "/",
    element: <Layout />,
    children: [
      // / → Shop
      { 
        index: true, 
        element: <Shop /> 
      },

      // /cart → 購物車（要登入）
      { 
        path: "cart", 
        element: (
          <RequireAuth>
            <Cart />
          </RequireAuth>
        ) 
      },

      // /face-enroll → Face ID 註冊（要登入）
      { 
        path: "face-enroll", 
        element: (
          <RequireAuth>
            <FaceEnroll />
          </RequireAuth>
        ) 
      },
    ],
  },

  // 404
  { 
    path: "*", 
    element: <div style={{ padding: 20 }}>404 找不到此頁</div> 
  },
]);