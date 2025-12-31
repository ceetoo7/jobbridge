import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import { SKILLS } from "../utils/skills";
import { LOCATIONS } from "../utils/locations";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    district: "",
    area: "",
    skill: "",
    expectedRate: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/users/me");
        const data = res.data;
        setUser(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          district: data.location?.district || "",
          area: data.location?.area || "",
          skill: Array.isArray(data.skills) ? data.skills[0] || "" : "",
          expectedRate: data.expectedRate || "",
        });

        if (data.role === "worker" && data._id) {
          try {
            const histRes = await axiosInstance.get(
              `/gigs/applications/completed/worker/${data._id}`
            );
            const jobs = histRes.data || [];
            setHistory(jobs);

            // average rating by employer
            const ratings = jobs
              .map((j) => j.ratingEmployer?.stars)
              .filter(Boolean);
            const avg = ratings.length
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
              : null;
            setAverageRating(avg);
          } catch (err) {
            console.warn("Failed to fetch job history:", err.message);
            setHistory([]);
            setAverageRating(null);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert("Error loading profile. Try refreshing.");
        }
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
        location: {
          district: formData.district.trim(),
          area: formData.area.trim(),
        },
      };
      if (user?.role === "worker") {
        payload.skills = [formData.skill];
        payload.expectedRate = Number(formData.expectedRate);
      }

      const res = await axiosInstance.put("/users/me", payload);
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        phone: res.data.phone || "",
        district: res.data.location?.district || "",
        area: res.data.location?.area || "",
        skill: Array.isArray(res.data.skills) ? res.data.skills[0] || "" : "",
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
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {editing ? "Edit Profile" : "My Profile"}
      </h2>

      {/* Edit Form */}
      {editing ? (
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block font-medium mb-1">Name:</label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Phone:</label>
            <input
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              name="phone"
              value={formData.phone}
              readOnly
            />
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <label className="block font-semibold text-gray-700">
              Location:
            </label>
            <div>
              <label className="block mb-1 font-medium">District:</label>
              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.district}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    district: e.target.value,
                    area: "",
                  })
                }
                required
              >
                <option value="">Select District</option>
                {Object.keys(LOCATIONS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Area:</label>
              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                disabled={!formData.district}
                required
              >
                <option value="">Select Area</option>
                {formData.district &&
                  LOCATIONS[formData.district]?.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {user.role === "worker" && (
            <>
              <div>
                <label className="block font-medium mb-1">Skill:</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.skill}
                  onChange={(e) =>
                    setFormData({ ...formData, skill: e.target.value })
                  }
                  required
                >
                  <option value="">Select Skill</option>
                  {SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Expected Rate (NPR):
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.expectedRate}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedRate: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="flex space-x-4 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
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
        <>
          {/* Profile Info */}
          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-semibold">Name:</span> {user.name}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {user.phone}
            </p>
            <p>
              <span className="font-semibold">Location:</span>{" "}
              {user.location
                ? `${user.location.district}, ${user.location.area}`
                : "Not set"}
            </p>
            <p>
              <span className="font-semibold">Role:</span>{" "}
              {user.role === "worker" ? "Worker" : "Employer"}
            </p>
            {user.role === "worker" && (
              <>
                <p>
                  <span className="font-semibold">Skill:</span>{" "}
                  {Array.isArray(user.skills) ? user.skills[0] : ""}
                </p>
                <p>
                  <span className="font-semibold">Expected Rate:</span> NPR{" "}
                  {user.expectedRate}/perday
                </p>
              </>
            )}
            <button
              onClick={() => setEditing(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
            >
              Edit Profile
            </button>
          </div>

          {/* Worker Completed Jobs */}
          {user.role === "worker" && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Completed Jobs
              </h3>
              <p className="mb-2">
                Total Completed: {history.length} | Average Rating:{" "}
                {averageRating || "-"}
              </p>
              <div className="space-y-4">
                {history.length > 0 ? (
                  history.map((job) => (
                    <div
                      key={job._id}
                      className="border p-4 rounded-lg shadow-sm bg-gray-50"
                    >
                      <p className="font-semibold">{job.gig?.title}</p>
                      <p>
                        Location: {job.gig?.location?.district},{" "}
                        {job.gig?.location?.area}
                      </p>
                      <p>Offered Rate: NPR {job.gig?.offeredRate}/perday</p>
                      <p>Employer: {job.gig?.employer?.name || "-"}</p>
                      {job.ratingEmployer && (
                        <p>
                          Rating: {job.ratingWorker.stars} ★{" "}
                          {job.ratingWorker.review &&
                            `- "${job.ratingWorker.review}"`}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No completed jobs yet.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
