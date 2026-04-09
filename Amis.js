import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, getDocs
} from "firebase/firestore";

function Amis() {
  const user = auth.currentUser;
  const [tab, setTab]         = useState("demandes");
  const [requests, setRequests] = useState([]);
  const [friends, setFriends]   = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sent, setSent]         = useState({});

  // Demandes reçues
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("to", "==", user.uid),
      where("status", "==", "pending")
    );
    return onSnapshot(q, snap =>
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  // Amis acceptés
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("status", "==", "accepted")
    );
    return onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => d.data())
        .filter(d => d.from === user.uid || d.to === user.uid);
      setFriends(list);
    });
  }, [user]);

  // Tous les users pour "Rechercher"
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "users")).then(snap => {
      setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== user.uid));
    });
  }, [user]);

  const accept = async (req) => {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
    // Notif
    await addDoc(collection(db, "notifications"), {
      to:       req.from,
      fromName: user.displayName,
      message:  "a accepté votre demande d'ami.",
      type:     "friend",
      read:     false,
      timestamp: serverTimestamp(),
    });
  };

  const reject = async (req) => {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "rejected" });
  };

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

  const tabs = [
    { key: "demandes",   label: "Demandes",   badge: requests.length },
    { key: "amis",       label: "Mes Amis",   badge: friends.length },
    { key: "rechercher", label: "Rechercher", badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-roseMPale">
      <Navbar user={user} />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-8">
        <h2 className="text-xl font-black text-roseM mb-4">
          <i className="fas fa-user-group mr-2"></i>Amis
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition
                ${tab === t.key ? "bg-roseM text-white" : "bg-white text-gray-500 hover:bg-roseMPale hover:text-roseM"}`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? "bg-white text-roseM" : "bg-roseM text-white"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Demandes reçues */}
        {tab === "demandes" && (
          <div className="flex flex-col gap-3">
            {requests.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400 text-sm">
                <i className="fas fa-user-clock text-4xl mb-3 block text-gray-200"></i>
                Tsy misy demande mbola
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                {r.fromPhoto
                  ? <img src={r.fromPhoto} alt="" className="w-12 h-12 rounded-full border-2 border-roseMLight object-cover"/>
                  : <div className="w-12 h-12 rounded-full bg-roseM flex items-center justify-center text-white font-black text-xl">
                      {r.fromName?.[0] || "?"}
                    </div>
                }
                <div className="flex-1">
                  <p className="font-bold text-sm">{r.fromName}</p>
                  <p className="text-xs text-gray-400">Demande d'ami</p>
                </div>
                <button onClick={() => accept(r)} className="bg-roseM text-white px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-pink-700 transition">
                  <i className="fas fa-check mr-1"></i>Accepter
                </button>
                <button onClick={() => reject(r)} className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mes amis */}
        {tab === "amis" && (
          <div className="flex flex-col gap-3">
            {friends.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400 text-sm">
                <i className="fas fa-users text-4xl mb-3 block text-gray-200"></i>
                Tsy misy amis mbola
              </div>
            )}
            {friends.map((f, i) => {
              const friendName = f.from === user.uid ? f.toName : f.fromName;
              return (
                <div key={i} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-roseM to-roseMLight flex items-center justify-center text-white font-black text-xl">
                    {friendName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{friendName || "Ami"}</p>
                    <p className="text-xs text-green-500 font-semibold">
                      <i className="fas fa-circle text-xs mr-1"></i>Ami
                    </p>
                  </div>
                  <button className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-roseMPale hover:text-roseM transition">
                    <i className="fas fa-comment mr-1"></i>Message
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Rechercher */}
        {tab === "rechercher" && (
          <div className="flex flex-col gap-3">
            {allUsers.map(u => (
              <div key={u.uid} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                {u.photoURL
                  ? <img src={u.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-roseMLight object-cover"/>
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-roseM to-roseMLight flex items-center justify-center text-white font-black text-xl">
                      {u.displayName?.[0] || "?"}
                    </div>
                }
                <div className="flex-1">
                  <p className="font-bold text-sm">{u.displayName || "Utilisateur"}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <button
                  onClick={() => sendRequest(u)}
                  disabled={sent[u.uid]}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition
                    ${sent[u.uid] ? "bg-gray-100 text-gray-400" : "bg-roseM text-white hover:bg-pink-700"}`}
                >
                  {sent[u.uid] ? <><i className="fas fa-check mr-1"></i>Envoyé</> : <><i className="fas fa-user-plus mr-1"></i>Ajouter</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Amis;
