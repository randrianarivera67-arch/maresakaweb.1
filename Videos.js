import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, orderBy, onSnapshot, limit,
  doc, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

function VideoCard({ post }) {
  const user  = auth.currentUser;
  const liked = post.likes?.includes(user?.uid);

  const toggleLike = async () => {
    if (!user) return;
    await updateDoc(doc(db, "posts", post.id), {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Video player */}
      <video
        src={post.mediaUrl}
        controls
        style={{ width: "100%", maxHeight: 360, background: "#000", display: "block" }}
      />

      {/* Info */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          {post.userPhoto
            ? <img src={post.userPhoto} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pink-pale)" }} />
            : <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg,#e8318a,#f472b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: 15
              }}>
                {post.userName?.[0] || "?"}
              </div>
          }
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{post.userName}</div>
            <div style={{ fontSize: 11, color: "var(--gray-text)" }}>{timeAgo(post.timestamp)}</div>
          </div>
        </div>
        {post.text && (
          <p style={{ fontSize: 14, marginBottom: 10 }}>{post.text}</p>
        )}
        {/* Actions */}
        <div className="post-actions" style={{ margin: "0 -16px", borderTop: "1px solid #f3f4f6" }}>
          <button className={`post-action-btn${liked ? " liked" : ""}`} onClick={toggleLike}>
            <i className="fas fa-thumbs-up"></i>
            J'aime{post.likes?.length > 0 ? ` (${post.likes.length})` : ""}
          </button>
          <button className="post-action-btn">
            <i className="fas fa-comment"></i> Commenter
          </button>
          <button className="post-action-btn">
            <i className="fas fa-share"></i> Partager
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const user = auth.currentUser;
  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("mediaUrl", "!=", ""),
      orderBy("mediaUrl"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const vids = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.mediaUrl?.match(/\.(mp4|mov|avi|webm)/i));
      setVideos(vids);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar user={user} />
      <div className="page-content" style={{ maxWidth: 680 }}>

        <h2 className="page-title">
          <i className="fas fa-play-circle"></i> Vidéos
        </h2>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i className="fas fa-spinner fa-spin" style={{ color: "var(--pink)", fontSize: 26 }}></i>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-video-slash"></i>
            Tsy misy vidéo mbola. Alefaso ny voalohany!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {videos.map(v => <VideoCard key={v.id} post={v} />)}
        </div>
      </div>
    </div>
  );
}
