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

        setApplications(res.data); // each application has _id + worker + status
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

      // Update status locally
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

  return (
    <div className="max-w-3xl mx-auto bg-white px-6 py-10">
      <h1 className="text-4xl font-bold text-primary mb-8 tracking-tight">
        Applicants
      </h1>

      {applications.length === 0 ? (
        <p className="text-secondary text-lg">No applicants yet.</p>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const statusColor =
              app.status === "accepted"
                ? "bg-green-100 text-green-800 border-green-300"
                : app.status === "rejected"
                ? "bg-red-100 text-red-800 border-red-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300";

            return (
              <div
                key={`${app._id}-${app.status}`}
                className="bg-background p-6 rounded-2xl shadow-lg hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-semibold text-primary">
                      {app.worker?.name || "Unknown Worker"}
                    </p>

                    {app.worker?.location && (
                      <p className="text-gray-600">
                        {app.worker.location.district},{" "}
                        {app.worker.location.area}
                      </p>
                    )}

                    {app.worker?.skills?.length > 0 && (
                      <p className="text-gray-700 mt-1">
                        <span className="font-semibold">Skills:</span>{" "}
                        {app.worker.skills.join(", ")}
                      </p>
                    )}

                    {app.worker?.expectedRate != null && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Expected Rate:</span>{" "}
                        Rs. {app.worker.expectedRate}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColor}`}
                  >
                    {app.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-6 flex gap-3">
                  {app.status === "pending" && (
                    <>
                      <button
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-medium"
                        onClick={() => handleAction(app._id, "accept")}
                      >
                        Accept
                      </button>

                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                        onClick={() => handleAction(app._id, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {app.status === "accepted" && app.worker?.phone && (
                    <a
                      href={`tel:${app.worker.phone}`}
                      className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-primary transition font-medium"
                    >
                      Contact Worker
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
