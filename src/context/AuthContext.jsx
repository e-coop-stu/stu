// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
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
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Navigate } from "react-router-dom";

const AuthContext = createContext(null);

/** 判斷是否在 GitHub Pages（建議一律用 redirect 避免 popup 卡住） */
function isGitHubPages() {
  const h = window.location.hostname;
  return h.endsWith("github.io");
}

/** 取得 / 建立 students/{uid} 的學生資料（含餘額） */
async function ensureStudentDoc(user) {
  if (!user) return null;

  const ref = doc(db, "students", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const data = {
      email: user.email || "",
      balance: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return { id: ref.id, ...data };
  }

  return { id: snap.id, ...snap.data() };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // ✅ 讓 redirect 登入回來後能正確完成流程（GitHub Pages 必備）
    getRedirectResult(auth).catch((e) => {
      // 沒有 redirect 事件時，Firebase 有時會拋這個，忽略即可
      if (e?.code !== "auth/no-auth-event") {
        console.warn("[Auth] getRedirectResult error:", e);
      }
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      (async () => {
        setUser(u || null);

        if (u) {
          try {
            const stu = await ensureStudentDoc(u);
            setStudent(stu);
          } catch (err) {
            console.warn("[Auth] ensureStudentDoc error:", err);
            setStudent(null);
          }
        } else {
          setStudent(null);
        }

        setInitializing(false);
      })();
    });

    return () => unsub();
  }, []);

  async function refreshStudent() {
    if (!user) {
      setStudent(null);
      return null;
    }
    const stu = await ensureStudentDoc(user);
    setStudent(stu);
    return stu;
  }

  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    setUser(u);

    const stu = await ensureStudentDoc(u);
    setStudent(stu);

    return u;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    setUser(u);

    const stu = await ensureStudentDoc(u);
    setStudent(stu);

    return u;
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setStudent(null);
  }

  /** ✅ Google 登入：GitHub Pages → redirect；localhost → popup */
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // GitHub Pages 上 popup 容易卡（COOP/第三方 cookie/彈窗限制），直接用 redirect 最穩
    if (isGitHubPages()) {
      await signInWithRedirect(auth, provider);
      return;
    }

    // 本機開發：先 popup，真的被擋再 fallback redirect
    try {
      const cred = await signInWithPopup(auth, provider);
      const u = cred.user;
      setUser(u);

      const stu = await ensureStudentDoc(u);
      setStudent(stu);

      return u;
    } catch (e) {
      const popupIssues = [
        "auth/operation-not-supported-in-this-environment",
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
      ];
      if (popupIssues.includes(e?.code)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
  }

  const value = {
    user,
    student,
    initializing,
    signup,
    login,
    logout,
    loginWithGoogle,
    refreshStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

export function RequireAuth({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) return <div style={{ padding: 20 }}>載入中…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}