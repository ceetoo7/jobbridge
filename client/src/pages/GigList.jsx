import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GigList() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5001/api/gigs", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load gigs");
        return res.json();
      })
      .then((data) => {
        setGigs(data);
        setLoading(false); // ✅ FIXED: stop loading
      })
      .catch((err) => {
        console.error("Gig fetch error:", err);
        setLoading(false); // ✅ FIXED: even on error, stop loading
      });
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;

  return (
    <div className="max-w-3xl mx-auto my-8 p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Available Gigs</h2>

      {gigs.length === 0 ? (
        <p className="text-center text-gray-500">
          No gigs available at the moment.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {gigs.map((gig) => (
            <div
              key={gig._id}
              onClick={() => navigate(`/gigs/${gig._id}`)}
              className={`p-4 rounded-xl shadow-md border-l-4 transition cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                gig.isExploitative ? "border-red-500" : "border-green-500"
              }`}
            >
              <h3 className="text-lg font-semibold mb-1">{gig.title}</h3>
              <p>
                <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
              </p>
              <p>
                <strong>Skill:</strong> {gig.skill}
              </p>
              <p>
                <strong>Location:</strong> {gig.location}
              </p>
              <p>
                <strong>Offered Rate:</strong> NPR {gig.offeredRate}
              </p>
              {gig.isExploitative && (
                <p className="text-red-500 mt-1">⚠️ Below fair wage</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
