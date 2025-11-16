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
    <div>
      <h2>My Gigs</h2>
      {gigs.length === 0 ? (
        <p>No gigs posted yet.</p>
      ) : (
        <ul>
          {gigs.map((gig) => (
            <li key={gig._id}>
              <h3>{gig.title}</h3>
              <p>{gig.description}</p>
              <button onClick={() => editGig(gig._id)}>Edit</button>
              <button onClick={() => deleteGig(gig._id)}>Delete</button>
              <button onClick={() => viewApplicants(gig._id)}>
                View Applicants
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyGigs;
