import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PostForm from "../components/PostForm";
import Feed from "../components/Feed";
import RightPanel from "../components/RightPanel";
import { auth } from "../firebase/firebaseConfig";

export default function Home() {
  const user = auth.currentUser;
  return (
    <div style={{ minHeight: "100vh", background: "var(--pink-bg)" }}>
      <Navbar user={user} />
      <div className="page-layout">
        {/* Left sidebar */}
        <div className="left-col">
          <Sidebar />
        </div>

        {/* Main feed */}
        <main className="feed">
          <PostForm user={user} />
          <Feed />
        </main>

        {/* Right panel */}
        <div className="right-col">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
