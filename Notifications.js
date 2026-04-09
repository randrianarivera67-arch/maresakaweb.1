import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, writeBatch
} from "firebase/firestore";

function Notifications() {
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

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
    return `il y a ${Math.floor(diff/86400)} j`;
  }

  const iconMap = {
    like:    { icon: "fa-thumbs-up",  color: "bg-blue-500" },
    comment: { icon: "fa-comment",    color: "bg-green-500" },
    friend:  { icon: "fa-user-plus",  color: "bg-roseM" },
    message: { icon: "fa-envelope",   color: "bg-purple-500" },
    default: { icon: "fa-bell",       color: "bg-roseM" },
  };

  return (
    <div className="min-h-screen bg-roseMPale">
      <Navbar user={user} />
      <div className="max-w-xl mx-auto pt-20 px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-roseM">
            <i className="fas fa-bell mr-2"></i>Notifications
          </h2>
          {notifs.some(n => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-roseM hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {notifs.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <i className="fas fa-bell-slash text-5xl mb-3 block text-gray-200"></i>
            Tsy misy notifications mbola
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notifs.map(n => {
            const s = iconMap[n.type] || iconMap.default;
            return (
              <div
                key={n.id}
                onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true })}
                className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition
                  ${!n.read ? "bg-white shadow border-l-4 border-roseM" : "bg-white/70 shadow-sm hover:bg-white"}`}
              >
                <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                  <i className={`fas ${s.icon}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">
                    <strong>{n.fromName}</strong> {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-roseM mt-1 flex-shrink-0"></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
