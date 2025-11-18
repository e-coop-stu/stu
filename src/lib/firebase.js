// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔥 用 Firebase Console 上的資料，但我們自己修正 storageBucket & apiKey
const firebaseConfig = {
  // 👇 請確認這一行跟 Firebase Console 的 apiKey 一模一樣
  apiKey: "AIzaSyCA3JFCqMW_CwpdkWRE_kv8XrYKD1QhU08",
  authDomain: "shop-f387d.firebaseapp.com",
  projectId: "shop-f387d",

  // ‼️ 這個不要用 console 給的 firebasestorage.app
  // ‼️ 一定要改成 appspot.com 才能正常配合 Auth / Firestore
  storageBucket: "shop-f387d.appspot.com",

  messagingSenderId: "484766516898",
  appId: "1:484766516898:web:8a824617a7d4dee6841b9fb",
  measurementId: "G-S94H7MR8G0",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出給整個專案用
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);