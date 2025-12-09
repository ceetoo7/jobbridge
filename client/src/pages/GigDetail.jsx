import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { getFairWage } from "../utils/fairWage";

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

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

        // compute fair wage & exploitative flag
        const fair = getFairWage(data.location, data.skill);
        const isExploitative = data.offeredRate < fair * 0.95; // 95% threshold
        setGig({ ...data, fairRate: fair, isExploitative });
      } catch (err) {
        console.error("Fetch gig error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id, navigate]);

  const handleApply = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as a worker to apply.");
      navigate("/login");
      return;
    }

    setApplying(true);

    try {
      const res = await axiosInstance.post(
        `/gigs/${id}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200 || res.status === 201) {
        alert("✅ Applied successfully!");
        setApplied(true);
      } else {
        alert(res.data.error || "Failed to apply.");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Network error while applying.");
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gig...</p>;
  if (!gig)
    return <p className="text-center mt-10 text-gray-500">Gig not found.</p>;

  const token = localStorage.getItem("token");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const isWorker = decoded?.role === "worker";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#EDE7E3] rounded-2xl shadow-lg mt-12">
      <h2 className="text-3xl font-bold mb-4 text-[#16697A]">{gig.title}</h2>

      <p className="text-gray-700 mb-2">
        <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Skill:</strong> {gig.skill}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Location:</strong>{" "}
        {typeof gig.location === "string"
          ? gig.location
          : `${gig.location.area} - ${gig.location.district}`}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Offered Rate:</strong> NPR {gig.offeredRate.toLocaleString()}
      </p>
      <p className="text-gray-700 mb-4">
        <strong>Fair Rate:</strong> NPR {gig.fairRate?.toLocaleString()}
      </p>

      {gig.isExploitative ? (
        <p className="text-red-600 font-semibold mb-4">
          ⚠️ This gig is below fair wage.
        </p>
      ) : (
        <p className="text-green-600 font-semibold mb-4">
          ✅ This gig meets fair wage standards.
        </p>
      )}

      <p className="text-gray-700 mb-6">{gig.description}</p>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#489FB5] hover:bg-[#16697A] text-white px-5 py-2 rounded-lg transition"
        >
          ← Back
        </button>

        {isWorker && !applied && (
          <button
            onClick={handleApply}
            disabled={applying}
            className={`bg-[#FFA62B] hover:bg-[#FF8C00] text-white px-5 py-2 rounded-lg transition ${
              applying ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {applying ? "Applying..." : "Apply"}
          </button>
        )}

        {isWorker && applied && (
          <span className="text-green-700 font-semibold self-center">
            Applied ✔️
          </span>
        )}
      </div>
    </div>
  );
}
