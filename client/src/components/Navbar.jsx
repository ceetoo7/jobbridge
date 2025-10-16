// client/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>JobBridge Nepal</h2>
      <div className="nav-links">
        <Link to="/">Home</Link>
        {!token ? (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        ) : (
          <>
            <Link to="/post-gig">Post Gig</Link>
            <Link to="/gigs">Find Work</Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
