import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, orderBy, limit,
  onSnapshot, getDocs, where,
  addDoc, serverTimestamp, doc, updateDoc
} from "firebase/firestore";

/* ─── timeAgo helper ─────────────────────── */
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

/* ─── Suggestions d'amis ─────────────────── */
function FriendSuggestions() {
  const user = auth.currentUser;
  const [suggestions, setSuggestions] = useState([]);
  const [sent, setSent] = useState({});

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), limit(6));
    getDocs(q).then(snap => {
      const others = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== user.uid);
      setSuggestions(others.slice(0, 3));
    });
  }, [user]);

  const sendRequest = async (toUser) => {
    await addDoc(collection(db, "friendRequests"), {
      from:      user.uid,
      fromName:  user.displayName,
      fromPhoto: user.photoURL || "",
      to:        toUser.uid,
      status:    "pending",
      timestamp: serverTimestamp(),
    });
    setSent(prev => ({ ...prev, [toUser.uid]: true }));
  };

  return (
    <div className="panel-card">
      <div className="panel-title">
        <i className="fas fa-user-plus"></i> Suggestions d'amis
      </div>

      {suggestions.length === 0 && (
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>
          Tsy misy suggestions mbola
        </p>
      )}

      {suggestions.map(u => (
        <div key={u.uid} className="friend-item">
          {u.photoURL
            ? <img src={u.photoURL} alt="" className="friend-avatar" />
            : <div className="friend-avatar-ini">{u.displayName?.[0] || "?"}</div>
          }
          <div className="friend-info">
            <div className="friend-name">{u.displayName || "Utilisateur"}</div>
            <div className="friend-time">Nouveau membre</div>
          </div>
          <button
            onClick={() => !sent[u.uid] && sendRequest(u)}
            className={`btn-ajouter${sent[u.uid] ? " sent" : ""}`}
            disabled={sent[u.uid]}
          >
            {sent[u.uid] ? <><i className="fas fa-check" style={{ marginRight: 4 }}></i>Envoyé</> : "Ajouter"}
          </button>
        </div>
      ))}

      <button className="voir-plus-link">
        Vous pourriez les connaître &rsaquo;
      </button>
    </div>
  );
}

/* ─── Notifications panel ────────────────── */
function NotificationsPanel() {
  const user = auth.currentUser;
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="panel-card">
      <div className="panel-title">
        <i className="fas fa-bell"></i>
        Notifications
        {unreadCount > 0 && (
          <span style={{
            background: "#e8318a", color: "#fff",
            borderRadius: 99, fontSize: 11, fontWeight: 800,
            padding: "1px 7px", marginLeft: 4
          }}>
            {unreadCount}
          </span>
        )}
      </div>

      {notifs.length === 0 && (
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>
          Tsy misy notifications
        </p>
      )}

      {notifs.map(n => (
        <div
          key={n.id}
          className={`notif-item${!n.read ? " unread" : ""}`}
          onClick={() => markRead(n.id)}
        >
          <div className="notif-avatar-ini">
            {n.fromName?.[0] || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="notif-text">
              <strong>{n.fromName}</strong> {n.message}
            </div>
            <div className="notif-time">{timeAgo(n.timestamp)}</div>
          </div>
          {!n.read && <div className="notif-dot"></div>}
        </div>
      ))}
    </div>
  );
}

/* ─── Vidéos Populaires ──────────────────── */
const PLACEHOLDERS = [
  { id: "p1", label: "Voyage et Aventure", duration: "03:25",
    gradient: "linear-gradient(135deg,#166534,#4ade80)", icon: "fa-mountain-sun" },
  { id: "p2", label: "Recette Délicieuse",  duration: "01:15",
    gradient: "linear-gradient(135deg,#9a3412,#fb923c)", icon: "fa-utensils" },
  { id: "p3", label: "Musique Malagasy",    duration: "04:02",
    gradient: "linear-gradient(135deg,#581c87,#c084fc)", icon: "fa-music" },
  { id: "p4", label: "Sport & Fitness",     duration: "02:30",
    gradient: "linear-gradient(135deg,#1e3a8a,#60a5fa)", icon: "fa-dumbbell" },
];

function VideosPanel() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("mediaUrl", "!=", ""),
      orderBy("mediaUrl"),
      orderBy("timestamp", "desc"),
      limit(4)
    );
    const unsub = onSnapshot(q, snap => {
      const vids = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.mediaUrl?.match(/\.(mp4|mov|avi|webm)/i));
      setVideos(vids.slice(0, 4));
    });
    return () => unsub();
  }, []);

  const items = videos.length >= 2 ? videos : PLACEHOLDERS;

  return (
    <div className="panel-card">
      <div className="panel-title">
        <i className="fas fa-play-circle"></i> Vidéos Populaires
      </div>
      <div className="videos-grid">
        {items.slice(0, 4).map((v, i) => {
          const ph = PLACEHOLDERS[i % 4];
          return (
            <div key={v.id} className="video-thumb">
              {v.mediaUrl
                ? <video src={v.mediaUrl} className="video-thumb-bg" style={{ objectFit: "cover" }} />
                : (
                  <div
                    className="video-thumb-bg"
                    style={{ background: ph.gradient }}
                  >
                    <i className={`fas ${ph.icon}`} style={{ color: "#fff", fontSize: 24, opacity: 0.85 }}></i>
                  </div>
                )
              }
              <div className="video-overlay">
                <i className="fas fa-play"></i>
              </div>
              <span className="video-duration">
                {v.duration || ph.duration}
              </span>
              <div className="video-label">
                {v.text || ph.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── EXPORT ─────────────────────────────── */
export default function RightPanel() {
  return (
    <>
      <FriendSuggestions />
      <NotificationsPanel />
      <VideosPanel />
    </>
  );
}
