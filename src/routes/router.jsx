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
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "shop", element: <Shop /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "face-enroll", element: <FaceEnroll /> },
      { path: "orders", element: <Orders /> },   // ✅ 已付款
      { path: "records", element: <Records /> }, // ✅ 預訂
      { path: "login", element: <Login /> },
    ],
  },
]);