import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function Applicants() {
  const { gigId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5001/api/gigs/${gigId}/applicants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setApplications(data);
        setLoading(false);
      })
      .catch(() => {
        alert("Failed to load applicants");
        setLoading(false);
      });
  }, [gigId]);

  if (loading) return <p>Loading applicants...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <h2>Applicants</h2>
      {applications.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        applications.map((app) => (
          <div
            key={app._id}
            style={{
              border: "1px solid #ddd",
              padding: "1rem",
              margin: "1rem 0",
            }}
          >
            <h3>{app.worker.name}</h3>
            <p>Location: {app.worker.location}</p>
            <p>Skills: {app.worker.skills?.join(", ")}</p>
            <p>Phone: {app.worker.phone}</p>
          </div>
        ))
      )}
    </div>
  );
}
