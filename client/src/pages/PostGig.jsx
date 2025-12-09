import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOCATIONS } from "../utils/locations.js";
import { SKILLS } from "../utils/skills.js";

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
    if (!token) return alert("You must be logged in.");

    const location = `${selectedDistrict} - ${selectedArea}`;

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
          skill: selectedSkill,
          location,
          offeredRate: Number(offeredRate),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Gig posted!");
        navigate("/gigs");
      } else {
        alert(data.error || "Failed to post gig");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
      <h2 className="text-2xl text-primary font-bold mb-6">Post a Gig</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 bg-white border border-gray-300 rounded"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full p-2 bg-white border border-gray-300 rounded h-24"
        />

        {/* Skill Dropdown */}
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          required
          className="w-full p-2 bg-white border border-gray-300 rounded"
        >
          <option value="">Select Skill</option>
          {SKILLS.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        {/* District Dropdown */}
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setSelectedArea("");
          }}
          required
          className="w-full p-2 bg-white border border-gray-300 rounded"
        >
          <option value="">Select District</option>
          {Object.keys(LOCATIONS).map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        {/* Area Dropdown (depends on district) */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          required
          disabled={!selectedDistrict}
          className="w-full p-2 bg-white border border-gray-300 rounded disabled:bg-gray-100"
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
          type="number"
          placeholder="Offered Rate (NPR)"
          value={offeredRate}
          onChange={(e) => setOfferedRate(e.target.value)}
          required
          className="w-full p-2 bg-white border border-gray-300 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white p-2 rounded hover:bg-highlight"
        >
          {loading ? "Posting..." : "Post Gig"}
        </button>
      </form>
    </div>
  );
}
