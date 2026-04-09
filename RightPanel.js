import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, orderBy, limit,
  onSnapshot, getDocs, where,
  addDoc, serverTimestamp, doc, updateDoc
} from "firebase/firestore";

/* ─── Suggestions d'amis ─────────────────── */
function FriendSuggestions() {
  const user = auth.currentUser;
  const [suggestions, setSuggestions] = useState([]);
  const [sent, setSent] = useState({});

  useEffect(() => {
    if (!user) return;
    // Prendre des utilisateurs au hasard (hors soi-même)
    const q = query(collection(db, "users"), limit(5));
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
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-black text-roseM text-sm mb-4">
        <i className="fas fa-user-plus mr-2"></i>Suggestions d'amis
      </h3>
      {suggestions.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Tsy misy suggestions mbola
        </p>
      )}
      <div className="flex flex-col gap-3">
        {suggestions.map(u => (
          <div key={u.uid} className="flex items-center gap-2">
            {u.photoURL
              ? <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-roseMLight"/>
              : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-roseM to-roseMLight flex items-center justify-center text-white font-black flex-shrink-0">
                  {u.displayName?.[0] || "?"}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate">{u.displayName || "Utilisateur"}</p>
              <p className="text-xs text-gray-400">Nouveau membre</p>
            </div>
            <button
              onClick={() => sendRequest(u)}
              disabled={sent[u.uid]}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex-shrink-0
                ${sent[u.uid]
                  ? "bg-gray-100 text-gray-400 cursor-default"
                  : "bg-roseM text-white hover:bg-pink-700"}`}
            >
              {sent[u.uid] ? <><i className="fas fa-check mr-1"></i>Envoyé</> : "Ajouter"}
            </button>
          </div>
        ))}
      </div>
      <button className="mt-4 text-xs font-bold text-roseM hover:underline block w-full text-center">
        Vous pourriez les connaître ›
      </button>
    </div>
  );
}

/* ─── Notifications ──────────────────────── */
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

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `${Math.floor(diff/60)} min`;
    if (diff < 86400) return `${Math.floor(diff/3600)} h`;
    return `${Math.floor(diff/86400)} j`;
  }

  const iconMap = {
    like:    { icon: "fa-thumbs-up",   color: "from-blue-400 to-blue-600" },
    comment: { icon: "fa-comment",      color: "from-green-400 to-green-600" },
    friend:  { icon: "fa-user-plus",    color: "from-roseM to-roseMLight" },
    message: { icon: "fa-envelope",     color: "from-purple-400 to-purple-600" },
    default: { icon: "fa-bell",         color: "from-roseM to-roseMLight" },
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-black text-roseM text-sm mb-4">
        <i className="fas fa-bell mr-2"></i>Notifications
        {notifs.filter(n => !n.read).length > 0 && (
          <span className="ml-2 bg-roseM text-white text-xs rounded-full px-2 py-0.5">
            {notifs.filter(n => !n.read).length}
          </span>
        )}
      </h3>
      {notifs.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Tsy misy notifications
        </p>
      )}
      <div className="flex flex-col gap-3">
        {notifs.map(n => {
          const style = iconMap[n.type] || iconMap.default;
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex items-start gap-2 cursor-pointer rounded-xl p-1.5 transition
                ${!n.read ? "bg-roseMPale" : "hover:bg-gray-50"}`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center text-white text-xs flex-shrink-0`}>
                <i className={`fas ${style.icon}`}></i>
              </div>
              <div>
                <p className="text-xs leading-relaxed">
                  <strong>{n.fromName}</strong> {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-roseM ml-auto mt-1 flex-shrink-0"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Vidéos Populaires ──────────────────── */
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

  // Placeholders si pas encore de vraies vidéos
  const placeholders = [
    { id: "p1", label: "Voyage et Aventure", duration: "03:25", gradient: "from-green-700 to-green-400", icon: "fa-mountain-sun" },
    { id: "p2", label: "Recette Délicieuse",  duration: "01:15", gradient: "from-orange-700 to-orange-400", icon: "fa-utensils" },
    { id: "p3", label: "Musique Malagasy",    duration: "04:02", gradient: "from-purple-700 to-purple-400", icon: "fa-music" },
    { id: "p4", label: "Sport & Fitness",     duration: "02:30", gradient: "from-blue-700 to-blue-400", icon: "fa-dumbbell" },
  ];

  const items = videos.length >= 2 ? videos : placeholders;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-black text-roseM text-sm mb-4">
        <i className="fas fa-play-circle mr-2"></i>Vidéos Populaires
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.slice(0, 4).map((v, i) => (
          <div key={v.id} className="rounded-xl overflow-hidden cursor-pointer group relative">
            {v.mediaUrl
              ? <video src={v.mediaUrl} className="w-full h-20 object-cover"/>
              : <div className={`w-full h-20 bg-gradient-to-br ${placeholders[i % 4].gradient} flex items-center justify-center`}>
                  <i className={`fas ${placeholders[i % 4].icon} text-white text-2xl opacity-80`}></i>
                </div>
            }
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <i className="fas fa-play text-white text-lg"></i>
            </div>
            <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
              {v.duration || placeholders[i % 4].duration}
            </span>
            <p className="text-xs font-semibold text-center mt-1 truncate px-1">
              {v.text || placeholders[i % 4].label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EXPORT ─────────────────────────────── */
function RightPanel() {
  return (
    <div className="flex flex-col gap-4 sticky top-20">
      <FriendSuggestions />
      <NotificationsPanel />
      <VideosPanel />
    </div>
  );
}

export default RightPanel;
