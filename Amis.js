import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, getDocs
} from "firebase/firestore";

export default function Amis() {
  const user = auth.currentUser;
  const [tab, setTab]           = useState("demandes");
  const [requests, setRequests] = useState([]);
  const [friends, setFriends]   = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sent, setSent]         = useState({});
  const [search, setSearch]     = useState("");

  /* Demandes reçues */
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

  /* Amis acceptés */
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

  /* Tous les users */
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "users")).then(snap => {
      setAllUsers(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.uid !== user.uid)
      );
    });
  }, [user]);

  const accept = async (req) => {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
    await addDoc(collection(db, "notifications"), {
      to:        req.from,
      fromName:  user.displayName,
      message:   "a accepté votre demande d'ami.",
      type:      "friend",
      read:      false,
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

  const filteredUsers = allUsers.filter(u =>
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <Navbar user={user} />
      <div className="page-content" style={{ maxWidth: 680 }}>

        <h2 className="page-title">
          <i className="fas fa-user-group"></i> Amis
        </h2>

        {/* Tabs */}
        <div className="tabs-bar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab-btn${tab === t.key ? " active" : ""}`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="tab-badge">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Demandes reçues ── */}
        {tab === "demandes" && (
          <div>
            {requests.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-user-clock"></i>
                Tsy misy demande mbola
              </div>
            )}
            {requests.map(r => (
              <div key={r.id} className="user-card">
                {r.fromPhoto
                  ? <img src={r.fromPhoto} alt="" className="user-card-avatar" />
                  : <div className="user-card-avatar-ini">{r.fromName?.[0] || "?"}</div>
                }
                <div className="user-card-info">
                  <div className="user-card-name">{r.fromName}</div>
                  <div className="user-card-sub">Demande d'ami</div>
                </div>
                <button onClick={() => accept(r)} className="btn-accept">
                  <i className="fas fa-check" style={{ marginRight: 5 }}></i>Accepter
                </button>
                <button onClick={() => reject(r)} className="btn-reject">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Mes amis ── */}
        {tab === "amis" && (
          <div>
            {friends.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-users"></i>
                Tsy misy amis mbola
              </div>
            )}
            {friends.map((f, i) => {
              const friendName = f.from === user.uid ? f.toName : f.fromName;
              return (
                <div key={i} className="user-card">
                  <div className="user-card-avatar-ini">{friendName?.[0] || "?"}</div>
                  <div className="user-card-info">
                    <div className="user-card-name">{friendName || "Ami"}</div>
                    <div className="user-card-sub" style={{ color: "#22c55e" }}>
                      <i className="fas fa-circle" style={{ fontSize: 8, marginRight: 4 }}></i>Ami
                    </div>
                  </div>
                  <button className="btn-reject" style={{ marginLeft: 0 }}>
                    <i className="fas fa-comment" style={{ marginRight: 5 }}></i>Message
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rechercher ── */}
        {tab === "rechercher" && (
          <div>
            <input
              type="text"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", marginBottom: 12,
                padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #e5e7eb",
                fontFamily: "Nunito, sans-serif",
                fontSize: 14, outline: "none",
                background: "#fff"
              }}
            />
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-search"></i>
                Tsy misy utilisateur hita
              </div>
            )}
            {filteredUsers.map(u => (
              <div key={u.uid} className="user-card">
                {u.photoURL
                  ? <img src={u.photoURL} alt="" className="user-card-avatar" />
                  : <div className="user-card-avatar-ini">{u.displayName?.[0] || "?"}</div>
                }
                <div className="user-card-info">
                  <div className="user-card-name">{u.displayName || "Utilisateur"}</div>
                  <div className="user-card-sub">{u.email}</div>
                </div>
                <button
                  onClick={() => !sent[u.uid] && sendRequest(u)}
                  className={`btn-accept${sent[u.uid] ? "" : ""}`}
                  style={sent[u.uid] ? { background: "#e5e7eb", color: "#6b7280", cursor: "default" } : {}}
                  disabled={sent[u.uid]}
                >
                  {sent[u.uid]
                    ? <><i className="fas fa-check" style={{ marginRight: 5 }}></i>Envoyé</>
                    : <><i className="fas fa-user-plus" style={{ marginRight: 5 }}></i>Ajouter</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
