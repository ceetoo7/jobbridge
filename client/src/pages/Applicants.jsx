// Applicants.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Applicants() {
  const { gigId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!gigId) return;

    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5001/api/gigs/${gigId}/applicants`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setApplicants(res.data);
      } catch (err) {
        console.error("Failed to fetch applicants:", err);
        setError(err.response?.data?.message || err.message);
      }
    };

    fetchApplicants();
  }, [gigId]);

  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Applicants</h1>

      {applicants.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        applicants.map((a) => (
          <div
            key={a._id}
            style={{
              border: "1px solid #ccc",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px",
              background: "#fff",
            }}
          >
            <p>
              <strong>Name:</strong> {a.name}
            </p>

            {a.phone && (
              <p>
                <strong>Phone:</strong> {a.phone}
              </p>
            )}

            {a.location && (
              <p>
                <strong>Location:</strong> {a.location}
              </p>
            )}

            {a.skills?.length > 0 && (
              <p>
                <strong>Skills:</strong> {a.skills.join(", ")}
              </p>
            )}

            {a.expectedRate && (
              <p>
                <strong>Expected Rate:</strong> Rs. {a.expectedRate}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
