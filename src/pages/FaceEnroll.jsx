// src/pages/FaceEnroll.jsx
import React, { useState } from "react";
import { auth, storage, db } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function FaceEnroll() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // 選取照片
  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setMsg("❌ 請選擇圖片檔案（jpg / png）");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  }

  // 上傳
  async function onUpload() {
    if (!auth.currentUser) {
      setMsg("❌ 請先登入帳號後才能註冊 Face ID");
      return;
    }
    if (!file) {
      setMsg("❌ 請先選擇照片");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const uid = auth.currentUser.uid;
      const time = Date.now();
      const path = `faces/${uid}/enroll-${time}.jpg`;

      // 上傳到 storage
      const r = ref(storage, path);
      await uploadBytes(r, file);

      // 取得 URL
      const url = await getDownloadURL(r);

      // Firestore 建立一筆 pending 記錄
      await setDoc(doc(db, "face_enrollments", `${uid}-${time}`), {
        uid,
        storagePath: path,
        url,
        status: "pending",     // 之後樹莓派把 pending → ready
        createdAt: serverTimestamp(),
      });

      setMsg("✅ 上傳成功！等待系統訓練完成後即可使用 Face ID。");
    } catch (err) {
      console.error(err);
      setMsg("❌ 上傳失敗：" + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Face ID 註冊</h1>

      <p className="muted">
        上傳一張清楚的正臉照片供系統訓練。註冊後即可使用 Face ID 消費。
      </p>

      {/* 選照片 */}
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

      {/* 按鈕 */}
      <button
        className="btn primary"
        disabled={busy || !file}
        onClick={onUpload}
        style={{ marginTop: 12 }}
      >
        {busy ? "處理中…" : "上傳 Face ID"}
      </button>

      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}