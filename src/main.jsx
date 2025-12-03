// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { startInventoryHeartbeat } from "./services/store";

// 每分鐘清除逾時訂單
startInventoryHeartbeat(60 * 1000);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 🔥 全站外框：讓你的網站變漂亮 */}
    <div className="app-shell">
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </div>
  </React.StrictMode>
);