// client/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { LOCATIONS } from "../utils/locations";
import { SKILLS } from "../utils/skills";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("worker");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    district: "",
    area: "",
    skills: [],
    expectedRate: "",
  });

  // update value
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // multi-select skills
  const handleSkillsChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((o) => o.value);
    setFormData((prev) => ({ ...prev, skills: values }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.district ||
      !formData.area
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (role === "worker") {
      if (formData.skills.length === 0 || !formData.expectedRate) {
        alert("Please select skills and expected rate.");
        return;
      }
    }

    // prepare payload
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      role,
      location: {
        district: formData.district,
        area: formData.area,
      },
    };

    if (role === "worker") {
      payload.skills = formData.skills;
      payload.expectedRate = Number(formData.expectedRate);
    }

    try {
      const res = await axiosInstance.post("/auth/register", payload);
      localStorage.setItem("token", res.data.token);
      alert("Registration successful!");
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Register as{" "}
          <span className="text-primary">
            {role === "worker" ? "Worker" : "Employer"}
          </span>
        </h2>

        {/* Role selector */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 "
        >
          <option value="worker">Worker</option>
          <option value="employer">Employer</option>
        </select>

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
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
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

          {/* District and Area dropdown */}
          <select
            name="district"
            value={formData.district}
            onChange={(e) => {
              handleChange(e);
              setFormData((prev) => ({ ...prev, area: "" })); // reset area on district change
            }}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select District</option>
            {Object.keys(LOCATIONS).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            name="area"
            value={formData.area}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Area</option>
            {formData.district &&
              LOCATIONS[formData.district].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>

          {role === "worker" && (
            <>
              <select
                multiple
                name="skills"
                value={formData.skills}
                onChange={handleSkillsChange}
                required
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              >
                {SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-highlight hover:text-primary transition-all"
          >
            Register
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-highlight hover:underline cursor-pointer"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
