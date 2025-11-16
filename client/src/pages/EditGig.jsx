// client/src/pages/EditGig.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function EditGig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill: "",
    location: "",
    offeredRate: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGig = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axiosInstance.get(`/gigs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          title: res.data.title,
          description: res.data.description,
          skill: res.data.skill,
          location: res.data.location,
          offeredRate: res.data.offeredRate,
        });
      } catch (err) {
        alert("Failed to load gig.");
        navigate("/my-gigs");
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axiosInstance.put(`/gigs/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Gig updated successfully!");
      navigate("/my-gigs");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gig...</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Edit Gig</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Skill"
          value={formData.skill}
          onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
          required
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
        />
        <input
          type="number"
          className="w-full p-2 border rounded"
          placeholder="Offered Rate (NPR)"
          value={formData.offeredRate}
          onChange={(e) =>
            setFormData({ ...formData, offeredRate: e.target.value })
          }
          required
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
