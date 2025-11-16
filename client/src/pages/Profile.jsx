// client/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    skills: "",
    expectedRate: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/users/me");
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
          skills: Array.isArray(res.data.skills) ? res.data.skills.join(", ") : "",
          expectedRate: res.data.expectedRate || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        alert("Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };

      if (user?.role === "worker") {
        payload.skills = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        payload.expectedRate = Number(formData.expectedRate);
      }

      const res = await axiosInstance.put("/users/me", payload);
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        phone: res.data.phone || "",
        location: res.data.location || "",
        skills: Array.isArray(res.data.skills) ? res.data.skills.join(", ") : "",
        expectedRate: res.data.expectedRate || "",
      });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!user) return <p className="text-center mt-10">No user data.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {editing ? "Edit Profile" : "My Profile"}
      </h2>

      {editing ? (
        <form className="space-y-4" onSubmit={handleSave}>
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            readOnly
          />
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          {user.role === "worker" && (
            <>
              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                name="skills"
                placeholder="Skills (e.g., Painter, Plumber)"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                required
              />
              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                name="expectedRate"
                type="number"
                placeholder="Expected Rate (NPR)"
                value={formData.expectedRate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedRate: e.target.value })
                }
                required
              />
            </>
          )}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {user.phone}
          </p>
          <p>
            <span className="font-semibold">Location:</span> {user.location}
          </p>
          <p>
            <span className="font-semibold">Role:</span>{" "}
            {user.role === "worker" ? "Worker" : "Employer"}
          </p>
          {user.role === "worker" && (
            <>
              <p>
                <span className="font-semibold">Skills:</span>{" "}
                {Array.isArray(user.skills) ? user.skills.join(", ") : ""}
              </p>
              <p>
                <span className="font-semibold">Expected Rate:</span> NPR{" "}
                {user.expectedRate}
              </p>
            </>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}
