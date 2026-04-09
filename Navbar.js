import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const LINKS = [
  { to: "/home",     icon: "fa-house",        label: "Accueil" },
  { to: "/messages", icon: "fa-comment-dots", label: "Messages" },
  { to: "/amis",     icon: "fa-user-group",   label: "Amis" },
  { to: "/notifs",   icon: "fa-bell",         label: "Notifications" },
  { to: "/videos",   icon: "fa-play-circle",  label: "Vidéos" },
  { to: "/profil",   icon: "fa-user",         label: "Profil" },
];

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 7 29.5 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.5-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 7 29.5 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 34.6 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8H5.9C9.2 37.9 16.1 43 24 43z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.2 35.5 43 30 43 24c0-1.3-.1-2.5-.4-3.9z"/>
    </svg>
  );
}

export default function Navbar({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/home" className="navbar-logo">
        <div className="navbar-logo-circle">M</div>
        <span className="navbar-logo-text">MARESAKA</span>
      </Link>

      {/* Navigation links */}
      <div className="navbar-links">
        {LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-btn${pathname.startsWith(l.to) ? " active" : ""}`}
          >
            <i className={`fas ${l.icon}`}></i>
            <span>{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Right side: user avatar or Google login button */}
      {user ? (
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ""}
              onClick={() => navigate("/profil")}
              title={user.displayName || "Profil"}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "2px solid #e8318a", cursor: "pointer", objectFit: "cover"
              }}
            />
          ) : (
            <div
              onClick={() => navigate("/profil")}
              title={user.displayName || "Profil"}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#e8318a", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer"
              }}
            >
              {user.displayName?.[0] || "?"}
            </div>
          )}
        </div>
      ) : (
        <button className="navbar-google-btn">
          <GoogleIcon /> Se connecter avec Google
        </button>
      )}
    </nav>
  );
}
