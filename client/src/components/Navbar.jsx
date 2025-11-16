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
    <nav className="navbar bg-gray-800 text-white p-4 flex justify-between items-center">
      <h2 className="text-xl font-bold">JobBridge Nepal</h2>
      <div className="nav-links flex space-x-4 items-center">
        <Link to="/" className="hover:text-gray-300">
          Home
        </Link>
        {token && userRole === "worker" && (
          <Link to="/matched-gigs" className="hover:text-gray-300">
            Matched Gigs
          </Link>
        )}
        <Link to="/profile" className="hover:text-gray-300">
          Profile
        </Link>
        {!token ? (
          <>
            <Link to="/register" className="hover:text-gray-300">
              Register
            </Link>
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
          </>
        ) : (
          <>
            {userRole === "worker" && (
              <Link to="/gigs" className="hover:text-gray-300">
                Find Work
              </Link>
            )}
            {userRole === "employer" && (
              <>
                <Link to="/post-gig" className="hover:text-gray-300">
                  Post Gig
                </Link>
                <Link to="/my-gigs" className="hover:text-gray-300">
                  My Gigs
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="logout-btn bg-red-600 px-2 py-1 rounded hover:bg-red-500"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
