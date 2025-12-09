import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MyGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchMyGigs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/gigs/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGigs(res.data);
    } catch (err) {
      console.error("Failed to fetch your gigs:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const deleteGig = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/gigs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGigs(gigs.filter((g) => g._id !== id));
    } catch (err) {
      console.error("Failed to delete gig:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const editGig = (id) => {
    navigate(`/edit-gig/${id}`);
  };

  const viewApplicants = (id) => {
    navigate(`/gig-applicants/${id}`);
  };

  useEffect(() => {
    fetchMyGigs();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6">
      <h2 className="text-4xl font-bold text-primary mb-8">My Gigs</h2>

      {gigs.length === 0 ? (
        <p className="text-gray-600 text-lg bg-white p-6 rounded-lg shadow border border-gray-200">
          No gigs posted yet.
        </p>
      ) : (
        <ul className="space-y-6">
          {gigs.map((gig) => (
            <li
              key={gig._id}
              className="p-6 bg-background rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-semibold text-primary">
                    {gig.title}
                  </h3>
                  <p className="text-gray-700 mt-2 leading-relaxed">
                    {gig.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() => editGig(gig._id)}
                  className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-highlight transition-all"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteGig(gig._id)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-700 transition-all"
                >
                  Delete
                </button>

                <button
                  onClick={() => viewApplicants(gig._id)}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-highlight transition-all"
                >
                  View Applicants
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyGigs;
