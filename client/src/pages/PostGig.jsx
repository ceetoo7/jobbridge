import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PostGig() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [offeredRate, setOfferedRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          skill,
          location,
          offeredRate: Number(offeredRate),
          // ❌ NO employer field needed!
        }),
      });

      if (res.ok) {
        alert("✅ Gig posted!");
        navigate("/gigs");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post gig");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto" }}>
      <h2>Post a Gig</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Skill"
          required
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          required
        />
        <input
          type="number"
          value={offeredRate}
          onChange={(e) => setOfferedRate(e.target.value)}
          placeholder="Offered Rate (NPR)"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post Gig"}
        </button>
      </form>
    </div>
  );
}
