import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { SKILLS } from "../utils/skills";
import { LOCATIONS } from "../utils/locations";

export default function EditGig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: [],
    district: "",
    area: "",
    offeredRate: "",
  });
  const [loading, setLoading] = useState(true);

  const { title, description, skill, district, area, offeredRate } = formData;

  useEffect(() => {
    const fetchGig = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axiosInstance.get(`/gigs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const gig = res.data;
        setFormData({
          title: gig.title,
          description: gig.description,
          skill: gig.skill || "",
          district: gig.location?.district || "",
          area: gig.location?.area || "",
          offeredRate: gig.offeredRate,
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
      // ensure skill is a string
      await axiosInstance.put(
        `/gigs/${id}`,
        {
          title,
          description,
          skill,
          location: { district, area },
          offeredRate: Number(offeredRate),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Gig updated successfully!");
      navigate("/my-gigs");
    } catch (err) {
      console.error("Update error:", err.response || err);
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-background rounded-xl shadow-lg">
      {" "}
      <h2 className="text-2xl font-bold  text-primary mb-4">Edit Gig</h2>{" "}
      <form onSubmit={handleSubmit} className="space-y-4">
        {" "}
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
          className="w-full p-2 border rounded h-24"
        />
        <label>Skills</label>
        <select
          value={formData.skills}
          onChange={(e) =>
            setFormData({
              ...formData,
              skills: Array.from(
                e.target.selectedOptions,
                (option) => option.value
              ),
            })
          }
          required
          className="w-full p-2 border rounded"
        >
          {SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label>District</label>
        <select
          value={district}
          onChange={(e) =>
            setFormData({ ...formData, district: e.target.value, area: "" })
          }
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Select District</option>
          {Object.keys(LOCATIONS).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label>Area</label>
        <select
          value={area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          required
          disabled={!district}
          className="w-full p-2 border rounded disabled:bg-gray-100"
        >
          <option value="">Select Area</option>
          {district &&
            LOCATIONS[district]?.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
        </select>
        <label>Offered Rate (NPR)</label>
        <input
          type="number"
          value={offeredRate}
          onChange={(e) =>
            setFormData({ ...formData, offeredRate: e.target.value })
          }
          required
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-primary rounded hover:bg-highlight"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
