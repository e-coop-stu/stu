// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const AuthContext = createContext(null);

// 🔹 取得 / 建立 students/{uid} 的學生資料（含餘額）
async function ensureStudentDoc(user) {
  if (!user) return null;

  const ref = doc(db, "students", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const data = {
      email: user.email || "",
      balance: 0, // 初始餘額
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return { id: ref.id, ...data };
  }

  return { id: snap.id, ...snap.data() };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Firebase Auth 使用者
  const [student, setStudent] = useState(null);  // Firestore students/{uid} 資料（含 balance）
  const [initializing, setInitializing] = useState(true);

  // 監聽登入狀態 + 處理 Redirect 結果
  useEffect(() => {
    // 處理 Google redirect 登入（Safari / GitHub Pages）
    getRedirectResult(auth).catch((e) => {
      // 沒有 redirect event 也會丟錯，直接忽略就好
      if (e?.code !== "auth/no-auth-event") {
        console.warn("[Auth] redirect result error:", e);
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
            console.warn("[Auth] load student doc error:", err);
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

  // ✅ 專門手動重新抓一次 students/{uid}（之後如果有「儲值」功能可以呼叫這個）
  async function refreshStudent() {
    if (!user) {
      setStudent(null);
      return null;
    }
    const stu = await ensureStudentDoc(user);
    setStudent(stu);
    return stu;
  }

  // 帳號密碼註冊
  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    setUser(u);

    const stu = await ensureStudentDoc(u);
    setStudent(stu);

    return u;
  }

  // 帳號密碼登入
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    setUser(u);

    const stu = await ensureStudentDoc(u);
    setStudent(stu);

    return u;
  }

  // 登出
  async function logout() {
    await signOut(auth);
    setUser(null);
    setStudent(null);
  }

  // 🔹 Google 登入：全部改走 redirect，避免 popup / COOP 問題
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    console.log("[Auth] use Google signInWithRedirect");
    await signInWithRedirect(auth, provider);
  }

  const value = {
    user,           // Firebase 使用者
    student,        // Firestore 的學生資料（balance 在這裡）
    initializing,
    signup,
    login,
    logout,
    loginWithGoogle,
    refreshStudent, // 之後如果餘額被合作社端改了，可以呼叫它重新抓資料
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

// 路由保護：沒登入就跳轉到 /login
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