// client/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Helper to decode JWT
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
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-primary text-white">
      <h2 className="text-2xl font-bold">JobBridge Nepal</h2>

      <div className="flex space-x-6 items-center">
        <Link to="/" className="transition hover:text-highlight">
          Home
        </Link>

        {token && userRole === "worker" && (
          <Link to="/matched-gigs" className="transition hover:text-highlight">
            Matched Gigs
          </Link>
        )}

        <Link to="/profile" className="transition hover:text-highlight">
          Profile
        </Link>

        {!token ? (
          <>
            <Link to="/register" className="transition hover:text-secondary">
              Register
            </Link>
            <Link to="/login" className="transition hover:text-highlight">
              Login
            </Link>
          </>
        ) : (
          <>
            {userRole === "worker" && (
              <Link to="/gigs" className="transition hover:text-highlight">
                Find Work
              </Link>
            )}
            {userRole === "employer" && (
              <>
                <Link
                  to="/post-gig"
                  className="transition hover:text-highlight"
                >
                  Post Gig
                </Link>
                <Link to="/my-gigs" className="transition hover:text-highlight">
                  My Gigs
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg transition bg-highlight text-black hover:bg-[#fd9300]"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
