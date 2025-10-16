// client/src/pages/GigDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function GigDetail() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await axiosInstance.get(`/gigs/${id}`);
        setGig(res.data);
      } catch (err) {
        setError("Failed to load gig.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id]);

  const handleApply = async () => {
    if (!window.confirm("Are you sure you want to apply for this gig?")) return;
    try {
      await axiosInstance.post(`/gigs/${id}/apply`);
      alert("Application submitted!");
      navigate("/gigs");
    } catch (err) {
      alert(
        "Failed to apply: " + (err.response?.data?.error || "Try again later.")
      );
    }
  };

  if (loading) return <p>Loading gig...</p>;
  if (error) return <p>{error}</p>;
  if (!gig) return <p>Gig not found.</p>;

  return (
    <div className="gig-detail">
      <h2>{gig.title}</h2>
      <p>
        <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
      </p>
      <p>
        <strong>Description:</strong> {gig.description || "No description"}
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
      <p>
        <strong>Fair Rate:</strong> NPR {gig.fairRate}
      </p>
      {gig.isExploitative && (
        <p style={{ color: "red" }}>⚠️ This wage is below fair rate!</p>
      )}
      <button onClick={handleApply}>Apply for this Gig</button>
    </div>
  );
}
