
import React from "react";
import { createHashRouter } from "react-router-dom";

import Layout from "../components/Layout";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import FaceEnroll from "../pages/FaceEnroll";
import { RequireAuth } from "../context/AuthContext";

export const router = createHashRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Shop /> },
      { path: "cart", element: <RequireAuth><Cart /></RequireAuth> },
      { path: "face-enroll", element: <RequireAuth><FaceEnroll /></RequireAuth> },
    ]
  },
  { path: "*", element: <div style={{ padding:20 }}>404 找不到此頁</div> }
]);
