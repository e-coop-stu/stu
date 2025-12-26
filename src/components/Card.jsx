import React from "react";

export default function Card({ children, style }) {
  return (
    <div
      className="card"
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}