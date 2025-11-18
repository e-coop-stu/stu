
import React, { useState } from "react";
import { auth, storage, db } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function FaceEnroll() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  }

  async function onUpload() {
    if (!auth.currentUser) return setMsg("請先登入");
    if (!file) return setMsg("請先選擇照片");
    setBusy(true); setMsg("");
    try {
      const uid = auth.currentUser.uid;
      const path = `faces/${uid}/enroll-${Date.now()}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      await setDoc(doc(db, "face_enrollments", `${uid}-${Date.now()}`), {
        uid, storagePath: path, url, status: "pending", createdAt: serverTimestamp()
      });
      setMsg("✅ 已送出！請由樹莓派處理成 ready 後即可刷臉付款。");
    } catch (e) {
      setMsg("上傳失敗：" + (e?.message || String(e)));
    } finally { setBusy(false); }
  }

  return (
    <div>
      <h1>上傳 Face ID</h1>
      <p className="muted">上傳清晰正臉照片，送出後會建立一筆待處理的入庫申請。</p>
      <input type="file" accept="image/*" onChange={onPick} />
      {preview && <img src={preview} alt="預覽" style={{ width:"100%", maxWidth:420, borderRadius:12, border:"1px solid var(--border)", marginTop:10 }} />}
      <div style={{ marginTop:12, display:"flex", gap:8 }}>
        <button className="btn primary" onClick={onUpload} disabled={busy || !file}>{busy?"處理中…":"上傳並送出"}</button>
      </div>
      {msg && <div style={{ marginTop:12 }}>{msg}</div>}
    </div>
  );
}
