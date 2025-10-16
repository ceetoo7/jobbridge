// client/src/pages/PostGig.jsx
import React, { useState } from "react";
import axiosInstance from "../api/axios";

export default function PostGig() {
  const [gig, setGig] = useState({
    title: "",
    description: "",
    skill: "",
    location: "",
    offeredRate: "",
  });

  const handleChange = (e) => {
    setGig({ ...gig, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In production: get employerId from JWT
      // For demo, use a placeholder valid ObjectId
      const employerId = "670f1b1b1b1b1b1b1b1b1b1b";

      const response = await axiosInstance.post("/gigs", {
        employerId,
        ...gig,
        offeredRate: Number(gig.offeredRate),
      });

      const isFair = !response.data.isExploitative;
      alert(
        `${isFair ? "✅ Fair wage!" : "⚠️ Exploitative!"}\n` +
          `Offered: NPR ${gig.offeredRate}\n` +
          `Fair Rate: NPR ${response.data.fairRate}`
      );
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="form-container">
      <h2>Post a Gig</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Job Title"
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />
        <input
          name="skill"
          placeholder="Required Skill (e.g., Plumber)"
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Location (Kathmandu, Lalitpur, Bhaktapur)"
          onChange={handleChange}
          required
        />
        <input
          name="offeredRate"
          type="number"
          placeholder="Offered Daily Rate (NPR)"
          onChange={handleChange}
          required
        />
        <button type="submit">Post Gig</button>
      </form>
    </div>
  );
}
