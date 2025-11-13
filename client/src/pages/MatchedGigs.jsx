// client/src/pages/MatchedGigs.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MatchedGigs = () => {
  const { currentUser } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      if (!currentUser) {
        setError("You are not logged in");
        setLoading(false);
        return;
      }

      try {
        const token = currentUser.token; // make sure your JWT token is here
        const res = await axios.get("http://localhost:5001/api/match/gigs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data)) {
          setGigs(res.data);
        } else {
          setGigs([]);
          console.warn("Matched gigs response is not an array:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch matched gigs:", err);
        setError("Failed to fetch matched gigs");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedGigs();
  }, [currentUser]);

  if (loading) return <p>Loading matched gigs...</p>;
  if (error) return <p>{error}</p>;
  if (gigs.length === 0) return <p>No matched gigs found.</p>;

  return (
    <div>
      <h2>Matched Gigs</h2>
      <ul>
        {gigs.map((gig) => (
          <li key={gig._id}>
            <h3>{gig.title}</h3>
            <p>{gig.description}</p>
            <p>Skills: {gig.skills.join(", ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchedGigs;
