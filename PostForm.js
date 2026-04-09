import { useState, useRef } from "react";
import { db, storage } from "../firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PostForm({ user }) {
  const [text, setText]     = useState("");
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [tab, setTab]       = useState("story");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!text.trim() && !file) return;
    setLoading(true);
    try {
      let mediaUrl = "";
      if (file) {
        const sRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        mediaUrl = await getDownloadURL(sRef);
      }
      await addDoc(collection(db, "posts"), {
        userId:    user.uid,
        userName:  user.displayName,
        userPhoto: user.photoURL || "",
        text:      text.trim(),
        mediaUrl,
        type:      tab,
        likes:     [],
        timestamp: serverTimestamp(),
      });
      setText(""); setFile(null); setPreview(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="create-header">Créer une publication</div>

      {/* Tabs */}
      <div className="create-tabs">
        {[
          { id: "story", icon: "fa-heart", label: "Story" },
          { id: "vente", icon: "fa-tag",   label: "Vente" }
        ].map(t => (
          <button
            key={t.id}
            className={`create-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="create-body">
        <textarea
          className="create-textarea"
          placeholder="Quoi de neuf ?"
          value={text}
          rows={3}
          onChange={e => setText(e.target.value)}
        />

        {/* Image preview */}
        {preview && (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
            />
            <button
              onClick={removeFile}
              style={{
                position: "absolute", top: 6, right: 6,
                background: "rgba(0,0,0,.5)", border: "none",
                color: "#fff", borderRadius: "50%",
                width: 26, height: 26, cursor: "pointer",
                fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* File name (non-image) */}
        {file && !preview && (
          <div style={{
            fontSize: 12, color: "#6b7280", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6
          }}>
            <i className="fas fa-paperclip" style={{ color: "#e8318a" }}></i>
            {file.name}
            <button
              onClick={removeFile}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
            >✕</button>
          </div>
        )}

        {/* Actions bar */}
        <div className="create-actions">
          <button className="create-action-btn">
            <i className="fas fa-align-left"></i> Texte
          </button>
          <label className="create-action-btn" style={{ cursor: "pointer" }}>
            <i className="fas fa-camera"></i> Photo / Vidéo
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </label>
          <button className="create-action-btn">
            <i className="fas fa-phone"></i> Prix / Contact
          </button>
          <button className="create-action-btn">
            <i className="fas fa-location-dot"></i> Lieu
          </button>
          <button
            className="btn-publish"
            onClick={handlePublish}
            disabled={loading || (!text.trim() && !file)}
          >
            {loading
              ? <i className="fas fa-spinner fa-spin"></i>
              : "Publier"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
