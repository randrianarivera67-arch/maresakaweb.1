import { auth, provider } from "../firebase/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 7 29.5 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.5-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 7 29.5 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 34.6 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8H5.9C9.2 37.9 16.1 43 24 43z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.2 35.5 43 30 43 24c0-1.3-.1-2.5-.4-3.9z"/>
    </svg>
  );
}

export default function Login() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (e) {
      setError("Tsy afaka niditra. Avereno indray.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "var(--pink)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 6,
          boxShadow: "0 6px 24px rgba(232,49,138,.35)"
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 32 }}>M</span>
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 900, color: "var(--pink)",
          letterSpacing: 2, marginBottom: 2
        }}>
          MARESAKA
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>
          Réseau Social Malagasy
        </p>

        {error && (
          <p style={{
            fontSize: 12, color: "#ef4444",
            marginBottom: 12, textAlign: "center",
            background: "#fef2f2", padding: "8px 12px",
            borderRadius: 8, width: "100%"
          }}>
            <i className="fas fa-circle-exclamation" style={{ marginRight: 6 }}></i>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 20px",
            border: "1.5px solid var(--gray-border)",
            borderRadius: 28, background: "#fff",
            fontFamily: "Nunito, sans-serif",
            fontSize: 14, fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            width: "100%", justifyContent: "center",
            transition: "border-color .15s, box-shadow .15s",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 1px 3px rgba(0,0,0,.08)"
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "var(--pink)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--gray-border)"; }}
        >
          <GoogleIcon />
          {loading
            ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Connexion…</>
            : "Se connecter avec Google"
          }
        </button>

        <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 20, textAlign: "center" }}>
          En vous connectant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  );
}
