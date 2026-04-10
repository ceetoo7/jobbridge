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

  // CV Upload states
  const [cvProfile, setCvProfile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvMessage, setCvMessage] = useState({ type: "", text: "" });
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

        // Fetch CV profile for workers
        if (data.role === "worker") {
          try {
            const cvRes = await axiosInstance.get("/cv/profile");
            setCvProfile(cvRes.data);
          } catch (err) {
            console.warn("Failed to fetch CV profile:", err.message);
          }
        }

        if (data.role === "worker" && data._id) {
          try {
            const histRes = await axiosInstance.get(
              `/gigs/applications/completed/worker/${data._id}`,
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

  // CV Upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file.type !== "application/pdf") {
      setCvMessage({ type: "error", text: "Only PDF files are allowed" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvMessage({ type: "error", text: "File size must be under 5MB" });
      return;
    }
    setSelectedFile(file);
    setCvMessage({ type: "", text: "" });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleCvUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setCvMessage({ type: "error", text: "Please select a PDF file" });
      return;
    }

    setCvLoading(true);
    setCvMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("cv", selectedFile);

      const response = await axiosInstance.post("/cv/upload/pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCvMessage({
        type: "success",
        text: "CV uploaded successfully! Vector profile created.",
      });
      setSelectedFile(null);
      setCvProfile((prev) => ({
        ...prev,
        hasCV: true,
        cvSummary: response.data.cvSummary,
        cvUploadedAt: response.data.cvUploadedAt,
      }));
      setShowCvUpload(false);
    } catch (err) {
      setCvMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to upload CV",
      });
    } finally {
      setCvLoading(false);
    }
  };

  const handleCvDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your CV?")) return;

    try {
      await axiosInstance.delete("/cv/delete");
      setCvMessage({ type: "success", text: "CV deleted successfully" });
      setCvProfile(null);
    } catch (err) {
      setCvMessage({ type: "error", text: "Failed to delete CV" });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!user) return <p className="text-center mt-10">No user data.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-background shadow-lg rounded-xl border border-gray-200">
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
                  {user.expectedRate}/ day
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

          {/* CV Upload Section - Worker Only */}
          {user.role === "worker" && (
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {cvProfile?.hasCV && (
                      <span className="text-sm font-normal px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload your CV to enable semantic matching CV with gigs
                  </p>
                </div>
                {!showCvUpload && (
                  <button
                    onClick={() => setShowCvUpload(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {cvProfile?.hasCV ? "Update CV" : "Upload CV"}
                  </button>
                )}
              </div>

              {/* CV Message */}
              {cvMessage.text && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg ${
                    cvMessage.type === "error"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-green-100 text-green-700 border border-green-200"
                  }`}
                >
                  {cvMessage.text}
                </div>
              )}

              {/* CV Profile Info */}
              {cvProfile?.hasCV && !showCvUpload && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {cvProfile.cvSummary?.wordCount || 0}
                      </p>
                      <p className="text-xs text-gray-600">Words</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {cvProfile.cvSummary?.detectedSkills?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600">Skills Detected</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {cvProfile.cvSummary?.experienceMentions?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600">Experience</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {cvProfile.cvUploadedAt
                          ? new Date(
                              cvProfile.cvUploadedAt,
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                      <p className="text-xs text-gray-600">Uploaded</p>
                    </div>
                  </div>

                  {cvProfile.cvSummary?.detectedSkills?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Detected Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cvProfile.cvSummary.detectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCvUpload(true)}
                      className="flex-1 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition"
                    >
                      Update CV
                    </button>
                    <button
                      onClick={handleCvDelete}
                      className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Your CV is now being used for
                      vector-based matching. Visit the{" "}
                      <strong>Matched Gigs</strong> page to see gig
                      recommendations!
                    </p>
                  </div>
                </div>
              )}

              {/* CV Upload Form */}
              {showCvUpload && (
                <form
                  onSubmit={handleCvUpload}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-5"
                >
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {cvProfile?.hasCV ? "Update Your CV" : "Upload Your CV"}
                  </h4>

                  {/* Drag-and-drop area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("cv-file-input").click()
                    }
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : selectedFile
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <input
                      id="cv-file-input"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div>
                        <div className="text-4xl mb-2">📄</div>
                        <p className="font-medium text-gray-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Click or drop to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📁</div>
                        <p className="font-medium text-gray-700">
                          Drag & drop your PDF here
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          PDF only, max 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end items-center mt-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCvUpload(false);
                          setSelectedFile(null);
                          setCvMessage({ type: "", text: "" });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={cvLoading || !selectedFile}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {cvLoading
                          ? "Processing..."
                          : cvProfile?.hasCV
                            ? "Update CV"
                            : "Create Vector Profile"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* No CV State */}
              {!cvProfile?.hasCV && !showCvUpload && (
                <div className="text-center py-8 bg-gray-50 border border-gray-200 border-dashed rounded-xl">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-gray-600 mb-4">
                    No CV uploaded yet. Upload your CV to enable AI-powered
                    matching!
                  </p>
                  <button
                    onClick={() => setShowCvUpload(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Upload CV
                  </button>
                </div>
              )}
            </div>
          )}

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
