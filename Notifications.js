import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, writeBatch
} from "firebase/firestore";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

const ICON_MAP = {
  like:    { icon: "fa-thumbs-up", bg: "#3b82f6" },
  comment: { icon: "fa-comment",   bg: "#22c55e" },
  friend:  { icon: "fa-user-plus", bg: "#e8318a" },
  message: { icon: "fa-envelope",  bg: "#a855f7" },
  default: { icon: "fa-bell",      bg: "#e8318a" },
};

export default function Notifications() {
  const user = auth.currentUser;
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(30)
    );
    return onSnapshot(q, snap =>
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markOne = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="page-wrapper">
      <Navbar user={user} />
      <div className="page-content" style={{ maxWidth: 600 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className="page-title" style={{ marginBottom: 0 }}>
            <i className="fas fa-bell"></i> Notifications
            {unreadCount > 0 && (
              <span style={{
                background: "#e8318a", color: "#fff",
                borderRadius: 99, fontSize: 12, fontWeight: 800,
                padding: "2px 8px", marginLeft: 8
              }}>
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "none", border: "none",
                color: "#e8318a", fontFamily: "Nunito, sans-serif",
                fontSize: 13, fontWeight: 700, cursor: "pointer"
              }}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Empty */}
        {notifs.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            Tsy misy notifications mbola
          </div>
        )}

        {/* List */}
        {notifs.map(n => {
          const s = ICON_MAP[n.type] || ICON_MAP.default;
          return (
            <div
              key={n.id}
              className={`notif-full${!n.read ? " unread" : ""}`}
              onClick={() => markOne(n.id)}
            >
              <div
                className="notif-icon-circle"
                style={{ background: s.bg }}
              >
                <i className={`fas ${s.icon}`}></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>
                  <strong>{n.fromName}</strong> {n.message}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                  {timeAgo(n.timestamp)}
                </p>
              </div>
              {!n.read && (
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#e8318a", flexShrink: 0, marginTop: 4
                }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
