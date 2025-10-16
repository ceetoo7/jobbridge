// client/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function Register() {
  const [role, setRole] = useState("worker");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    location: "",
    skills: "", // Always a string
    expectedRate: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ensure skills remains a string
    if (name === "skills" && typeof value !== "string") {
      console.warn("Skills must be a string. Skipping update.");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }

    if (role === "worker") {
      if (
        !formData.location.trim() ||
        !formData.skills.trim() ||
        !formData.expectedRate
      ) {
        alert("Please fill in all worker-specific fields.");
        return;
      }

      const rate = Number(formData.expectedRate);
      if (isNaN(rate) || rate <= 0) {
        alert("Expected rate must be a positive number.");
        return;
      }
    }

    try {
      // Build payload safely
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role,
      };

      if (role === "worker") {
        // Safely split skills string
        const skillList = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (skillList.length === 0) {
          alert("Please enter at least one valid skill.");
          return;
        }

        payload.location = formData.location.trim();
        payload.skills = skillList;
        payload.expectedRate = Number(formData.expectedRate);
      }

      const res = await axiosInstance.post("/auth/register", payload);
      localStorage.setItem("token", res.data.token);
      alert("Registration successful!");
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please try again.";
      alert("Error: " + errorMessage);
    }
  };

  return (
    <div className="form-container">
      <h2>Register as {role === "worker" ? "Worker" : "Employer"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone (e.g., 9841234567)"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="worker">Worker</option>
          <option value="employer">Employer</option>
        </select>

        {role === "worker" && (
          <>
            <input
              name="location"
              placeholder="Location (Kathmandu, Lalitpur, Bhaktapur)"
              value={formData.location}
              onChange={handleChange}
              required
            />
            <input
              name="skills"
              placeholder="Skills (e.g., Painter, Plumber)"
              value={formData.skills}
              onChange={handleChange}
              required
            />
            <input
              name="expectedRate"
              type="number"
              placeholder="Expected Daily Rate (NPR)"
              value={formData.expectedRate}
              onChange={handleChange}
              required
              min="1"
            />
          </>
        )}

        <button type="submit">Register</button>
      </form>
    </div>
  );
}
