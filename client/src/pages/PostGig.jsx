import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOCATIONS } from "../utils/locations";
import { SKILLS } from "../utils/skills";

export default function PostGig() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [offeredRate, setOfferedRate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return alert("Login required");

    setLoading(true);

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

          // 🔥 IMPORTANT FIXES
          skills: [selectedSkill], // ARRAY ✅
          location: {
            district: selectedDistrict,
            area: selectedArea,
          },

          offeredRate: Number(offeredRate),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return alert(data.error || "Failed to post gig");
      }

      alert("✅ Gig posted");
      navigate("/gigs");
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Post a Gig</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Title"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          required
          placeholder="Description"
          className="w-full p-2 border rounded h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <select
          required
          className="w-full p-2 border rounded"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
        >
          <option value="">Select Skill</option>
          {SKILLS.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        <select
          required
          className="w-full p-2 border rounded"
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setSelectedArea("");
          }}
        >
          <option value="">Select District</option>
          {Object.keys(LOCATIONS).map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          required
          disabled={!selectedDistrict}
          className="w-full p-2 border rounded"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="">Select Area</option>
          {selectedDistrict &&
            LOCATIONS[selectedDistrict].map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
        </select>

        <input
          required
          type="number"
          placeholder="Offered Rate (NPR)"
          className="w-full p-2 border rounded"
          value={offeredRate}
          onChange={(e) => setOfferedRate(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-primary text-white p-2 rounded"
        >
          {loading ? "Posting..." : "Post Gig"}
        </button>
      </form>
    </div>
  );
}
