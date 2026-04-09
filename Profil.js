import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { auth, db, storage } from "../firebase/firebaseConfig";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profil() {
  const user     = auth.currentUser;
  const navigate = useNavigate();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.displayName || "");
  const [bio,      setBio]      = useState("");
  const [saving,   setSaving]   = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [success,  setSuccess]  = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = user.photoURL;
      if (photoFile) {
        const sRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(sRef, photoFile);
        photoURL = await getDownloadURL(sRef);
      }
      await updateProfile(user, { displayName: name, photoURL });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name,
        photoURL,
        bio,
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = preview || user?.photoURL;

  return (
    <div className="page-wrapper">
      <Navbar user={user} />
      <div className="page-content" style={{ maxWidth: 600 }}>

        {/* Profile card */}
        <div className="card" style={{ overflow: "hidden", marginBottom: 14 }}>

          {/* Cover banner */}
          <div style={{
            height: 110,
            background: "linear-gradient(135deg, #e8318a 0%, #f472b6 60%, #fce7f3 100%)"
          }} />

          {/* Avatar + info */}
          <div style={{ padding: "0 20px 20px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -40, marginBottom: 12 }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{
                      width: 80, height: 80, borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,.15)"
                    }} />
                  : <div style={{
                      width: 80, height: 80, borderRadius: "50%",
                      background: "linear-gradient(135deg,#e8318a,#f472b6)",
                      border: "4px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 900, fontSize: 32,
                      boxShadow: "0 2px 8px rgba(0,0,0,.15)"
                    }}>
                      {user?.displayName?.[0] || "?"}
                    </div>
                }
                {editing && (
                  <label style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "var(--pink)", border: "2px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", fontSize: 11
                  }}>
                    <i className="fas fa-camera"></i>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                  </label>
                )}
              </div>

              {/* Name & email */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{user?.displayName}</div>
                <div style={{ fontSize: 13, color: "var(--gray-text)" }}>{user?.email}</div>
              </div>
            </div>

            {/* Bio */}
            {!editing && bio && (
              <p style={{ fontSize: 14, color: "var(--gray-text)", marginBottom: 14 }}>{bio}</p>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background: "#f0fdf4", color: "#16a34a",
                borderRadius: 8, padding: "8px 14px",
                fontSize: 13, fontWeight: 700, marginBottom: 12
              }}>
                <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                Profil mis à jour !
              </div>
            )}

            {/* Edit form */}
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-text)", display: "block", marginBottom: 4 }}>
                    Nom afichaina
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: "1.5px solid var(--gray-border)",
                      borderRadius: 8, fontFamily: "Nunito, sans-serif",
                      fontSize: 14, outline: "none"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--pink-light)"}
                    onBlur={e => e.target.style.borderColor = "var(--gray-border)"}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-text)", display: "block", marginBottom: 4 }}>
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Famelabelara ny tenanao…"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: "1.5px solid var(--gray-border)",
                      borderRadius: 8, fontFamily: "Nunito, sans-serif",
                      fontSize: 14, outline: "none", resize: "none"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--pink-light)"}
                    onBlur={e => e.target.style.borderColor = "var(--gray-border)"}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setEditing(false); setPreview(null); setPhotoFile(null); }}
                    style={{
                      padding: "8px 18px", borderRadius: 20,
                      border: "1.5px solid var(--gray-border)",
                      background: "#fff", fontFamily: "Nunito, sans-serif",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      color: "var(--gray-text)"
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-publish"
                    style={{ padding: "8px 22px" }}
                  >
                    {saving ? <i className="fas fa-spinner fa-spin"></i> : "Enregistrer"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 18px", borderRadius: 20,
                    border: "1.5px solid var(--pink)",
                    background: "#fff", color: "var(--pink)",
                    fontFamily: "Nunito, sans-serif",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "background .15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--pink-pale)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <i className="fas fa-user-pen"></i> Modifier le profil
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 18px", borderRadius: 20,
                    border: "1.5px solid var(--gray-border)",
                    background: "#fff", color: "var(--gray-text)",
                    fontFamily: "Nunito, sans-serif",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "border-color .15s, color .15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--gray-border)"; e.currentTarget.style.color = "var(--gray-text)"; }}
                >
                  <i className="fas fa-right-from-bracket"></i> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: "var(--pink)", marginBottom: 12 }}>
            <i className="fas fa-circle-info" style={{ marginRight: 7 }}></i>Informations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "fa-envelope",  label: "Email",      value: user?.email },
              { icon: "fa-calendar",  label: "Membre depuis", value: user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"
              },
              { icon: "fa-globe",     label: "Langue",     value: "Malagasy" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "var(--pink-pale)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <i className={`fas ${item.icon}`} style={{ color: "var(--pink)", fontSize: 13 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--gray-text)", fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
