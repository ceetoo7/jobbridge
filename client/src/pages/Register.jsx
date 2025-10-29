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
    skills: "",
    expectedRate: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for all users
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.password.trim() ||
      !formData.location.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Worker-specific validation
    if (role === "worker") {
      if (!formData.skills.trim() || !formData.expectedRate.trim()) {
        alert("Please fill in all worker-specific fields.");
        return;
      }

      const rate = Number(formData.expectedRate);
      if (isNaN(rate) || rate <= 0) {
        alert("Expected rate must be a positive number.");
        return;
      }
    }

    // Prepare payload
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      location: formData.location.trim(),
      role,
    };

    if (role === "worker") {
      const skillList = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      payload.skills = skillList;
      payload.expectedRate = Number(formData.expectedRate);
    }

    try {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Register as{" "}
          <span className="text-blue-600">
            {role === "worker" ? "Worker" : "Employer"}
          </span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="worker">Worker</option>
            <option value="employer">Employer</option>
          </select>

          <input
            name="location"
            placeholder="Location (e.g., Kathmandu, Lalitpur)"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {role === "worker" && (
            <>
              <input
                name="skills"
                placeholder="Skills (e.g., Plumber, Electrician)"
                value={formData.skills}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="expectedRate"
                type="number"
                placeholder="Expected Daily Rate (NPR)"
                value={formData.expectedRate}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            Register
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
