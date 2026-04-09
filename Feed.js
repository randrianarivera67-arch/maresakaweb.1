import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, orderBy, onSnapshot,
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

function PostCard({ post }) {
  const user = auth.currentUser;
  const liked = post.likes?.includes(user?.uid);

  const toggleLike = async () => {
    if (!user) return;
    const r = doc(db, "posts", post.id);
    await updateDoc(r, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="post-header">
        {post.userPhoto
          ? <img src={post.userPhoto} alt="" className="post-avatar" />
          : <div className="post-avatar-initials">{post.userName?.[0] || "?"}</div>
        }
        <div>
          <div className="post-name">{post.userName}</div>
          <div className="post-time">{timeAgo(post.timestamp)}</div>
        </div>
        <button className="post-more-btn" aria-label="Plus d'options">···</button>
      </div>

      {/* Text */}
      {post.text && <div className="post-text">{post.text}</div>}

      {/* Media */}
      {post.mediaUrl && (
        post.mediaUrl.match(/\.(mp4|webm|mov)/i)
          ? <video src={post.mediaUrl} controls className="post-img" />
          : <img src={post.mediaUrl} alt="" className="post-img" />
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`post-action-btn${liked ? " liked" : ""}`}
          onClick={toggleLike}
        >
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
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <i className="fas fa-spinner fa-spin" style={{ color: "#e8318a", fontSize: 26 }}></i>
    </div>
  );

  if (!posts.length) return (
    <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
      <i className="fas fa-newspaper" style={{ fontSize: 48, display: "block", marginBottom: 12, color: "#e5e7eb" }}></i>
      Tsy misy post mbola. Mamorona ny voalohany!
    </div>
  );

  return (
    <>
      {posts.map(p => <PostCard key={p.id} post={p} />)}
    </>
  );
}
