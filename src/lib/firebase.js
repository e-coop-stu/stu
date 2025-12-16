// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔥 完整正確的 Firebase Config（修正過 storageBucket）
const firebaseConfig = {
  apiKey: "AIzaSyCA3JFCqMW_CwpdkWRE_kv8XrYKDlQhU08",
  authDomain: "shop-f387d.firebaseapp.com",
  projectId: "shop-f387d",
  storageBucket: "shop-f387d.appspot.com",  // ← ← ← 這行最重要！！
  messagingSenderId: "484766516898",
  appId: "1:484766516898:web:8a82461a7d4dee6841b9fb",
  measurementId: "G-S94H7MR8G0"
};

// 初始化
const app = initializeApp(firebaseConfig);

// 匯出
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
window._auth = auth;