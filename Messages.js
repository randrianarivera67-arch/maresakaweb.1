import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, getDocs, or
} from "firebase/firestore";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export default function Messages() {
  const user = auth.currentUser;
  const [friends, setFriends]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState("");
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef();

  /* ── Charger les amis ── */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "friendRequests"),
      where("status", "==", "accepted")
    );
    return onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => d.data())
        .filter(d => d.from === user.uid || d.to === user.uid)
        .map(d => ({
          uid:   d.from === user.uid ? d.to   : d.from,
          name:  d.from === user.uid ? (d.toName   || "Ami") : d.fromName,
          photo: d.from === user.uid ? (d.toPhoto  || "") : d.fromPhoto,
        }));
      setFriends(list);
    });
  }, [user]);

  /* ── Charger les messages de la conversation ── */
  useEffect(() => {
    if (!user || !selected) return;
    const chatId = [user.uid, selected.uid].sort().join("_");
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
    return () => unsub();
  }, [user, selected]);

  const sendMessage = async () => {
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    const chatId = [user.uid, selected.uid].sort().join("_");
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        from:      user.uid,
        fromName:  user.displayName,
        text:      text.trim(),
        timestamp: serverTimestamp(),
      });
      /* Notification */
      await addDoc(collection(db, "notifications"), {
        to:        selected.uid,
        fromName:  user.displayName,
        message:   "vous a envoyé un message.",
        type:      "message",
        read:      false,
        timestamp: serverTimestamp(),
      });
      setText("");
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="page-wrapper">
      <Navbar user={user} />
      <div style={{
        maxWidth: 900, margin: "0 auto",
        padding: "calc(var(--navbar-h) + 16px) 16px 0",
        height: "100vh", display: "flex", flexDirection: "column"
      }}>
        <h2 className="page-title" style={{ marginBottom: 12 }}>
          <i className="fas fa-comment-dots"></i> Messages
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 12,
          flex: 1,
          overflow: "hidden",
          paddingBottom: 16
        }}>

          {/* ── Liste des amis ── */}
          <div className="card" style={{ overflow: "hidden auto" }}>
            <div style={{
              padding: "10px 14px", fontWeight: 800,
              fontSize: 13, color: "var(--pink)",
              borderBottom: "1px solid #f3f4f6"
            }}>
              Conversations
            </div>
            {friends.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                <i className="fas fa-users" style={{ fontSize: 32, display: "block", marginBottom: 8, color: "#e5e7eb" }}></i>
                Tsy misy amis mbola.<br />
                <a href="/amis" style={{ color: "var(--pink)", fontWeight: 700 }}>Tadiavo amis</a>
              </div>
            )}
            {friends.map(f => (
              <div
                key={f.uid}
                onClick={() => setSelected(f)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", cursor: "pointer",
                  background: selected?.uid === f.uid ? "var(--pink-pale)" : "transparent",
                  borderBottom: "1px solid #f9fafb",
                  transition: "background .15s"
                }}
              >
                {f.photo
                  ? <img src={f.photo} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pink-pale)" }} />
                  : <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg,#e8318a,#f472b6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 900, fontSize: 16
                    }}>
                      {f.name?.[0] || "?"}
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Ami</div>
                </div>
                {selected?.uid === f.uid && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pink)", flexShrink: 0 }}></div>
                )}
              </div>
            ))}
          </div>

          {/* ── Zone de chat ── */}
          <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!selected ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#9ca3af", gap: 12
              }}>
                <i className="fas fa-comment-dots" style={{ fontSize: 52, color: "#e5e7eb" }}></i>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Sélectionner une conversation</p>
                <p style={{ fontSize: 13 }}>Tsinjovy ny anarana amin'ny havia</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex", alignItems: "center", gap: 10
                }}>
                  {selected.photo
                    ? <img src={selected.photo} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg,#e8318a,#f472b6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 900, fontSize: 16
                      }}>
                        {selected.name?.[0] || "?"}
                      </div>
                  }
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
                      <i className="fas fa-circle" style={{ fontSize: 7, marginRight: 4 }}></i>En ligne
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflow: "hidden auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 20 }}>
                      Manomboka resaka vaovao amin'i {selected.name} 👋
                    </div>
                  )}
                  {messages.map(m => {
                    const isMe = m.from === user.uid;
                    return (
                      <div key={m.id} style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start"
                      }}>
                        <div style={{
                          maxWidth: "70%",
                          background: isMe ? "var(--pink)" : "#f3f4f6",
                          color: isMe ? "#fff" : "var(--text)",
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          padding: "9px 14px",
                          fontSize: 14,
                          boxShadow: "0 1px 2px rgba(0,0,0,.06)"
                        }}>
                          <div>{m.text}</div>
                          <div style={{
                            fontSize: 10,
                            color: isMe ? "rgba(255,255,255,.7)" : "#9ca3af",
                            textAlign: "right", marginTop: 3
                          }}>
                            {timeAgo(m.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div style={{
                  padding: "10px 14px",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <textarea
                    rows={1}
                    placeholder={`Envoyer un message à ${selected.name}…`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKey}
                    style={{
                      flex: 1, resize: "none",
                      border: "1.5px solid var(--gray-border)",
                      borderRadius: 20, padding: "9px 14px",
                      fontFamily: "Nunito, sans-serif", fontSize: 14,
                      outline: "none", lineHeight: 1.4,
                      transition: "border-color .15s"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--pink-light)"}
                    onBlur={e => e.target.style.borderColor = "var(--gray-border)"}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: text.trim() ? "var(--pink)" : "#e5e7eb",
                      border: "none", color: text.trim() ? "#fff" : "#9ca3af",
                      cursor: text.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, transition: "background .15s",
                      flexShrink: 0
                    }}
                  >
                    {sending
                      ? <i className="fas fa-spinner fa-spin"></i>
                      : <i className="fas fa-paper-plane"></i>
                    }
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
