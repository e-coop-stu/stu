// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // 監聽登入狀態 + 處理 Redirect 結果
  useEffect(() => {
    // 處理 Google redirect 登入（Safari 之類）
    getRedirectResult(auth)
      .then(() => {
        // 只要成功會自動觸發 onAuthStateChanged
      })
      .catch((e) => {
        console.warn("[Auth] redirect result error:", e);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setInitializing(false);
    });

    return () => unsub();
  }, []);

  // 帳號密碼註冊
  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  // 帳號密碼登入
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  // 登出
  async function logout() {
    await signOut(auth);
  }

  // Google 登入（先 popup，失敗再改 redirect）
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
      const cred = await signInWithPopup(auth, provider);
      return cred.user;
    } catch (e) {
      // Safari / 被擋 popup → 改走 redirect 流程
      const popupIssues = [
        "auth/operation-not-supported-in-this-environment",
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
      ];

      if (popupIssues.includes(e?.code)) {
        await signInWithRedirect(auth, provider);
        // 之後會重新載入頁面 → onAuthStateChanged 會把 user 塞進來
        return;
      }

      // 其他錯誤丟回去讓畫面顯示
      throw e;
    }
  }

  const value = {
    user,
    initializing,
    signup,
    login,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}

import { Navigate } from "react-router-dom";

export function RequireAuth({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div style={{ padding: 20 }}>載入中…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}