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
        status: "pending", // 之後樹莓派把 pending → ready
        createdAt: serverTimestamp(),
      });

      setMsg("✅ 上傳成功！等待系統訓練完成後即可使用 Face ID 消費。");
      // 上傳完成後可以清除檔案或保留預覽，看你習慣
      // setFile(null);
      // setPreview("");
    } catch (err) {
      console.error(err);
      setMsg("❌ 上傳失敗：" + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="section-title" style={{ marginBottom: 4 }}>
        Face ID 註冊
      </h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        上傳一張清楚、正面的臉部照片，系統訓練完成後，就可以在合作社使用 Face ID 付款。
      </p>

      {/* 小提示區塊 */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          background: "var(--primary-soft)",
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        📷 <b>拍攝小提示：</b>
        <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
          <li>請正對鏡頭，臉部置中。</li>
          <li>拿下口罩、帽子，避免頭髮遮住五官。</li>
          <li>光線充足、不要太背光。</li>
        </ul>
      </div>

      {/* 步驟 1：選照片 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          1. 選擇要上傳的照片
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={onPick}
        />
      </div>

      {/* 預覽圖片 */}
      {preview && (
        <div style={{ marginTop: 10, marginBottom: 14 }}>
          <div
            className="muted"
            style={{ fontSize: 13, marginBottom: 6 }}
          >
            預覽：
          </div>
          <img
            src={preview}
            alt="Face preview"
            className="face-preview"
          />
        </div>
      )}

      {/* 步驟 2：上傳 */}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          className="btn primary"
          disabled={busy || !file}
          onClick={onUpload}
        >
          {busy ? "處理中…" : "上傳並送出註冊"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            setFile(null);
            setPreview("");
            setMsg("");
          }}
        >
          清除選擇
        </button>
      </div>

      {/* 訊息顯示 */}
      {msg && (
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
          }}
          className={msg.startsWith("✅") ? "" : "text-error"}
        >
          {msg}
        </div>
      )}
    </div>
  );
}