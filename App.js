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

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-roseMPale gap-4">
      <div className="w-14 h-14 rounded-full bg-roseM flex items-center justify-center animate-pulse">
        <span className="text-white font-black text-2xl">M</span>
      </div>
      <i className="fas fa-spinner fa-spin text-roseM text-2xl"></i>
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
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
