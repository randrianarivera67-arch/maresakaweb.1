import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import useRegisterUser from "./hooks/useRegisterUser";

import Login         from "./pages/Login";
import Home          from "./pages/Home";
import Messages      from "./pages/Messages";
import Amis          from "./pages/Amis";
import Notifications from "./pages/Notifications";
import Profil        from "./pages/Profil";
import Videos        from "./pages/Videos";

function Loader() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--pink-bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "var(--pink)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "pulse 1.5s infinite"
      }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>M</span>
      </div>
      <i className="fas fa-spinner fa-spin" style={{ color: "var(--pink)", fontSize: 22 }}></i>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

function PrivateRoute({ user, children }) {
  if (user === undefined) return <Loader />;
  return user ? children : <Navigate to="/" replace />;
}

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useRegisterUser();

  const wrap = (Page) => (
    <PrivateRoute user={user}><Page /></PrivateRoute>
  );

  return (
    <Router>
      <Routes>
        <Route path="/"         element={user === undefined ? <Loader /> : user ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/home"     element={wrap(Home)} />
        <Route path="/messages" element={wrap(Messages)} />
        <Route path="/amis"     element={wrap(Amis)} />
        <Route path="/notifs"   element={wrap(Notifications)} />
        <Route path="/profil"   element={wrap(Profil)} />
        <Route path="/videos"   element={wrap(Videos)} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
