// src/components/PhotoUploader.jsx
import React, { useState } from "react";
import { storage } from "../lib/firebase"; // 你之前 firebase.js 匯出的 storage
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function PhotoUploader() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e) {
    setErr("");
    setUrl("");
    const f = e.target.files?.[0];
    if (!f) return;

    // 限制只收圖片
    if (!f.type.startsWith("image/")) {
      setErr("請選擇圖片檔（jpg / png 等）");
      return;
    }
    setFile(f);
  }

  function handleUpload() {
    if (!file) {
      setErr("請先選一張照片");
      return;
    }

    setErr("");
    setUploading(true);
    setProgress(0);

    // 上傳路徑：photos/時間_檔名
    const path = `photos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setProgress(pct);
      },
      error => {
        console.error(error);
        setErr(error.message || "上傳失敗，請稍後再試");
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(task.snapshot.ref);
        setUrl(downloadUrl);
        setUploading(false);
      }
    );
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
      <h3 style={{ marginBottom: 12 }}>上傳照片</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ marginBottom: 12 }}
      />

      <button
        className="btn primary"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "上傳中…" : "開始上傳"}
      </button>

      {progress > 0 && uploading && (
        <div style={{ marginTop: 8, fontSize: 14 }}>上傳進度：{progress}%</div>
      )}

      {err && (
        <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 14 }}>{err}</div>
      )}

      {url && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>上傳完成 ✅</div>
          <img
            src={url}
            alt="uploaded"
            style={{ width: "100%", borderRadius: 12, objectFit: "cover" }}
          />
          <div style={{ fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
            檔案網址：<br />
            <a href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}