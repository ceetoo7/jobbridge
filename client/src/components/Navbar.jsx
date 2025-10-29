// client/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Helper to decode JWT and extract payload
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  let userRole = null;

  if (token) {
    const decoded = parseJwt(token);
    userRole = decoded?.role || null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>JobBridge Nepal</h2>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        {!token ? (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        ) : (
          <>
            {userRole === "worker" && <Link to="/gigs">Find Work</Link>}
            {userRole === "employer" && (
              <>
                <Link to="/post-gig">Post Gig</Link>
                <Link to="/my-gigs">My Gigs</Link>
              </>
            )}{" "}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
