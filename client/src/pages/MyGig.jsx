import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MyGigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:5001/api/gigs/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load gigs");
        return res.json();
      })
      .then((data) => {
        setGigs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
        // Optional: show error message
      });
  }, [navigate]);

  if (loading) return <p>Loading your gigs...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Gigs</h2>
      {gigs.length === 0 ? (
        <p>No gigs posted yet.</p>
      ) : (
        gigs.map((gig) => (
          <div
            key={gig._id}
            style={{
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>{gig.title}</h3>
            <p>Location: {gig.location}</p>
            <p>Rate: NPR {gig.offeredRate}</p>
          </div>
        ))
      )}
    </div>
  );
}
