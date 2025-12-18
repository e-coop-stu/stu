import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { user, initializing, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ 如果已經登入（包含 Google redirect 回來），自動回首頁
  useEffect(() => {
    if (!initializing && user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "signin") await login(email.trim(), pw);
      else await signup(email.trim(), pw);

      // ✅ 用 navigate，比改 hash 穩
      navigate("/", { replace: true });
    } catch (e) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  // 避免閃一下登入頁
  if (initializing) {
    return <div className="container" style={{ padding: 24 }}>載入中…</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2>{mode === "signin" ? "登入" : "註冊"}</h2>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10 }}
          />
          <input
            placeholder="密碼"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10 }}
          />

          {msg && <div style={{ color: "#b91c1c" }}>{msg}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? "處理中…" : mode === "signin" ? "登入" : "註冊並登入"}
          </button>
        </form>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            className="btn ghost"
            onClick={() => {
              setMsg("");
              loginWithGoogle();
            }}
            disabled={busy}
          >
            使用 Google 登入
          </button>

          <button
            className="btn ghost"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            disabled={busy}
          >
            {mode === "signin" ? "改為註冊" : "改為登入"}
          </button>
        </div>
      </div>
    </div>
  );
}