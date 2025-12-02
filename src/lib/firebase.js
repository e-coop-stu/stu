// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 如果你真的有要用 Analytics 再開這行
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCA3JFCqMW_CwpdkWRE_kv8XrYKDlQhU08",   // ← 完全照 Firebase Console
  authDomain: "shop-f387d.firebaseapp.com",
  projectId: "shop-f387d",
  storageBucket: "shop-f387d.firebasestorage.app",
  messagingSenderId: "484766516898",
  appId: "1:484766516898:web:8a82461a7d4dee6841b9fb",
  measurementId: "G-S94H7MR8G0"
};

// 初始化 app
const app = initializeApp(firebaseConfig);

// 匯出給整個專案用
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 如果真的需要 Analytics 再加這兩行（目前不用也沒關係）
// const analytics = getAnalytics(app);
// export { analytics };