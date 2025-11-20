// Applicants.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Applicants() {
  const { gigId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!gigId) return;

    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:5001/api/gigs/${gigId}/applicants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setApplications(res.data); // res.data = array of applications with _id + worker
      } catch (err) {
        console.error("Failed to fetch applicants:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [gigId]);

  const handleAction = async (appId, action) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5001/api/gigs/${gigId}/applicants/${appId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update status locally without removing
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId
            ? { ...a, status: action === "accept" ? "accepted" : "rejected" }
            : a
        )
      );
    } catch (err) {
      console.error(`Failed to ${action} applicant:`, err);
      alert(
        `Failed to ${action} applicant: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  if (loading)
    return <p className="text-gray-500 mt-4">Loading applicants...</p>;
  if (error) return <p className="text-red-500 mt-4">Error: {error}</p>;

  const pendingApplications = applications.filter(
    (a) => a.status === "pending"
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Applicants</h1>

      {pendingApplications.length === 0 ? (
        <p className="text-gray-600">No pending applicants.</p>
      ) : (
        pendingApplications.map((app) => (
          <div
            key={app._id}
            className="bg-white p-4 mb-4 rounded-lg shadow-md border border-gray-200"
          >
            <p className="font-semibold">
              Name:{" "}
              <span className="font-normal">{app.worker?.name || "N/A"}</span>
            </p>
            {app.worker?.phone && (
              <p>
                Phone: <span className="font-normal">{app.worker.phone}</span>
              </p>
            )}
            {app.worker?.location && (
              <p>
                Location:{" "}
                <span className="font-normal">
                  {app.worker.location.district}, {app.worker.location.area}
                </span>
              </p>
            )}
            {app.worker?.skills?.length > 0 && (
              <p>
                Skills:{" "}
                <span className="font-normal">
                  {app.worker.skills.join(", ")}
                </span>
              </p>
            )}
            {app.worker?.expectedRate != null && (
              <p>
                Expected Rate:{" "}
                <span className="font-normal">
                  Rs. {app.worker.expectedRate}
                </span>
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                onClick={() => handleAction(app._id, "accept")}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                onClick={() => handleAction(app._id, "reject")}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
