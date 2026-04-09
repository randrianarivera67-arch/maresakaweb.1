import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const LANGS = ["Malagasy", "Français", "English"];

export default function Sidebar() {
  const [showLangs, setShowLangs] = useState(false);
  const [lang, setLang] = useState("Malagasy");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="sidebar-card">
      {/* Paramètres */}
      <div className="sidebar-item">
        <i className="fas fa-gear"></i>
        <span>Paramètres</span>
      </div>

      {/* Modifier Profil + langue */}
      <div
        className="sidebar-item"
        onClick={() => setShowLangs(v => !v)}
      >
        <i className="fas fa-user-pen"></i>
        <span>Modifier Profil</span>
        <i className={`fas fa-chevron-${showLangs ? "up" : "down"} chevron`}></i>
      </div>
      {showLangs && (
        <div className="sidebar-sublang">
          <div style={{ marginBottom: 4, color: "#9ca3af", fontSize: 12 }}>Langue :</div>
          {LANGS.map(l => (
            <div
              key={l}
              onClick={() => { setLang(l); setShowLangs(false); }}
              style={{
                padding: "3px 0",
                fontWeight: lang === l ? 800 : 600,
                color: lang === l ? "#e8318a" : "#374151",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              {lang === l && <i className="fas fa-check" style={{ marginRight: 6, fontSize: 11 }}></i>}
              {l}
            </div>
          ))}
        </div>
      )}
      {!showLangs && (
        <div className="sidebar-sublang">Langue: {lang}</div>
      )}

      {/* Messages */}
      <Link to="/messages" className="sidebar-item">
        <i className="fas fa-comment-dots"></i>
        <span>Messages</span>
      </Link>

      {/* Retrouver des Amis */}
      <Link to="/amis" className="sidebar-item">
        <i className="fas fa-user-group"></i>
        <span>Retrouver des Amis</span>
      </Link>

      {/* Notifications */}
      <Link to="/notifs" className="sidebar-item">
        <i className="fas fa-bell"></i>
        <span>Notifications</span>
      </Link>

      {/* Vidéos */}
      <Link to="/videos" className="sidebar-item">
        <i className="fas fa-play-circle"></i>
        <span>Vidéos</span>
      </Link>

      {/* Importation Publication */}
      <div className="sidebar-item">
        <i className="fas fa-upload"></i>
        <span>Importation Publication</span>
      </div>
    </div>
  );
}
