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
    // Worker-only fields
    skills: "",
    expectedRate: "",
    // Employer has no extra fields (for now)
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
          skills: Array.isArray(res.data.skills)
            ? res.data.skills.join(", ")
            : "",
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

      // Only include worker fields if user is a worker
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
        skills: Array.isArray(res.data.skills)
          ? res.data.skills.join(", ")
          : "",
        expectedRate: res.data.expectedRate || "",
      });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>No user data.</p>;

  return (
    <div className="form-container">
      <h2>{editing ? "Edit Profile" : "My Profile"}</h2>

      {editing ? (
        <form onSubmit={handleSave}>
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            readOnly
          />

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            required
          />
          {/* No condition — always shown */}
          {/* Only show worker fields if role is worker */}
          {user.role === "worker" && (
            <>
              <input
                name="skills"
                placeholder="Skills (e.g., Painter, Plumber)"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                required
              />
              <input
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
          <button type="submit">Save</button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone}
          </p>
          <p>
            <strong>Location:</strong> {user.location}
          </p>
          <p>
            <strong>Role:</strong>{" "}
            {user.role === "worker" ? "Worker" : "Employer"}
          </p>

          {user.role === "worker" && (
            <>
              <p>
                <strong>Skills:</strong>{" "}
                {Array.isArray(user.skills) ? user.skills.join(", ") : ""}
              </p>
              <p>
                <strong>Expected Rate:</strong> NPR {user.expectedRate}
              </p>
            </>
          )}

          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}
