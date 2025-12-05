import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCA3JFCqMW_CwpdkWRE_kv8XrYKD1QhU08",
  authDomain: "shop-f387d.firebaseapp.com",
  projectId: "shop-f387d",

  // ⬇️ 這行一定要用 appspot.com
  storageBucket: "shop-f387d.appspot.com",

  messagingSenderId: "484766516898",
  appId: "1:484766516898:web:8a824617a7d4dee6841b9fb",
  measurementId: "G-S94H7MR86Q",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);