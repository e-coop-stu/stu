// src/pages/FaceEnroll.jsx
import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function FaceEnroll() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // 讀檔案 → Base64
  function fileToBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // 去掉 data:image/jpeg;base64,
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  // 選取照片
  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setMsg("❌ 請選擇圖片檔案");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  }

  // 上傳 Firestore（Base64）
  async function onUpload() {
    if (!auth.currentUser) {
      return setMsg("❌ 請先登入");
    }
    if (!file) {
      return setMsg("❌ 請先選擇照片");
    }

    setBusy(true);
    setMsg("");

    try {
      const uid = auth.currentUser.uid;
      const time = Date.now();

      // 1. file → base64
      const base64 = await fileToBase64(file);

      // 2. Firestore 建立文件
      await setDoc(doc(db, "face_enrollments", `${uid}-${time}`), {
        uid,
        base64,               // ← 圖片的 Base64
        status: "pending",    // 樹莓派處理後會更新
        createdAt: serverTimestamp(),
      });

      setMsg("✅ 已送出！等待系統訓練完成。");
    } catch (err) {
      console.error(err);
      setMsg("❌ 上傳失敗：" + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Face ID 註冊（Base64）</h1>
      <p className="muted">系統會使用照片做 Face ID 訓練。</p>

      <input type="file" accept="image/*" onChange={onPick} />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{
            width: "100%",
            maxWidth: 400,
            marginTop: 12,
            borderRadius: 12,
            border: "1px solid #ccc",
          }}
        />
      )}

      <button
        className="btn primary"
        disabled={busy || !file}
        onClick={onUpload}
        style={{ marginTop: 12 }}
      >
        {busy ? "處理中…" : "送出 Face ID"}
      </button>

      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}