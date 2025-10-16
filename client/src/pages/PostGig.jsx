// client/src/pages/PostGig.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function PostGig() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill: "",
    location: "",
    offeredRate: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error/success when user types
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.title ||
      !formData.skill ||
      !formData.location ||
      !formData.offeredRate
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const rate = Number(formData.offeredRate);
    if (isNaN(rate) || rate <= 0) {
      setError("Offered rate must be a positive number.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // In a real app, get employerId from decoded JWT
      // For now, we assume backend accepts request from authenticated user
      const response = await axiosInstance.post("/gigs", {
        ...formData,
        offeredRate: rate,
      });

      setSuccess(true);
      setError("");

      // Optional: reset form
      setFormData({
        title: "",
        description: "",
        skill: "",
        location: "",
        offeredRate: "",
      });

      // Optional: redirect after 2 seconds
      setTimeout(() => {
        navigate("/gigs");
      }, 2000);
    } catch (err) {
      console.error("Gig creation error:", err.response?.data || err.message);
      setError(
        err.response?.data?.error || "Failed to post gig. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{success ? "✅ Gig Posted Successfully!" : "Post a New Gig"}</h2>

      {error && <div className="alert error">{error}</div>}
      {success && (
        <div className="alert success">
          Your gig has been posted! Redirecting to gigs list...
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Job Title (e.g., Paint living room)"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
          <input
            name="skill"
            placeholder="Required Skill (e.g., Painter)"
            value={formData.skill}
            onChange={handleChange}
            required
          />
          <input
            name="location"
            placeholder="Location (Kathmandu, Lalitpur, Bhaktapur)"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <input
            name="offeredRate"
            type="number"
            placeholder="Offered Daily Rate (NPR)"
            value={formData.offeredRate}
            onChange={handleChange}
            required
            min="1"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Gig"}
          </button>
        </form>
      )}
    </div>
  );
}
