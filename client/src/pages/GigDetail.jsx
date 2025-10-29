import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGig = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`http://localhost:5001/api/gigs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 401) {
          console.warn("Unauthorized — redirecting to login");
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to load gig");

        const data = await res.json();
        setGig(data);
      } catch (err) {
        console.error("Fetch gig error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id, navigate]);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gig...</p>;
  if (!gig)
    return <p className="text-center mt-10 text-gray-500">Gig not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-2">{gig.title}</h2>
      <p className="text-gray-700 mb-1">
        <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
      </p>
      <p className="text-gray-700 mb-1">
        <strong>Skill:</strong> {gig.skill}
      </p>
      <p className="text-gray-700 mb-1">
        <strong>Location:</strong> {gig.location}
      </p>
      <p className="text-gray-700 mb-1">
        <strong>Offered Rate:</strong> NPR {gig.offeredRate}
      </p>
      <p className="text-gray-700 mb-4">
        <strong>Fair Rate:</strong> NPR {gig.fairRate}
      </p>

      {gig.isExploitative ? (
        <p className="text-red-600 font-semibold">
          ⚠️ This gig is below fair wage.
        </p>
      ) : (
        <p className="text-green-600 font-semibold">
          ✅ This gig meets fair wage standards.
        </p>
      )}

      <p className="mt-4">{gig.description}</p>

      <button
        onClick={() => navigate(-1)}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        ← Back
      </button>
    </div>
  );
}
