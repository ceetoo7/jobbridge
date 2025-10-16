// client/src/pages/GigList.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export default function GigList() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await axiosInstance.get("/gigs");
        setGigs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  if (loading) return <p>Loading gigs...</p>;

  return (
    <div>
      <h2>Available Gigs</h2>
      {gigs.length === 0 ? (
        <p>No gigs available at the moment.</p>
      ) : (
        gigs.map((gig) => (
          <div
            key={gig._id}
            className={`gig-card ${
              gig.isExploitative ? "exploitative" : "fair"
            }`}
          >
            <h3>{gig.title}</h3>
            <p>
              <strong>Employer:</strong> {gig.employer?.name || "—"}
            </p>
            <p>
              <strong>Skill:</strong> {gig.skill}
            </p>
            <p>
              <strong>Location:</strong> {gig.location}
            </p>
            <p>
              <strong>Offered:</strong> NPR {gig.offeredRate}
            </p>
            <p>
              <strong>Fair Rate:</strong> NPR {gig.fairRate}
            </p>
            {gig.isExploitative && (
              <p className="warning">⚠️ Below fair wage</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
