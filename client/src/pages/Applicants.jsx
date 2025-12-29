import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Applicants() {
  const { gigId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingData, setRatingData] = useState({});

  useEffect(() => {
    if (!gigId) return;

    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5001/api/gigs/${gigId}/applicants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setApplications(res.data);
      } catch (err) {
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
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId
            ? { ...a, status: action === "accept" ? "accepted" : "rejected" }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const markCompleted = async (appId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/gigs/${gigId}/applicants/${appId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: "completed" } : a))
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const submitRating = async (appId) => {
    try {
      const token = localStorage.getItem("token");
      const { stars, review } = ratingData[appId] || {};
      if (!stars) {
        alert("Please select a star rating");
        return;
      }

      await axios.post(
        `http://localhost:5001/api/gigs/${gigId}/applicants/${appId}/rate-employer`,
        { stars, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId ? { ...a, employerRating: { stars, review } } : a
        )
      );
      alert("Rating submitted!");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">
        Applicants
      </h1>

      {applications.map((app) => (
        <div
          key={app._id}
          className="bg-background p-6 rounded-2xl shadow-md border border-gray-200 mb-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xl font-semibold text-primary">
                {app.worker?.name}
              </p>
              <p className="text-gray-600">
                {app.worker?.location?.district}, {app.worker?.location?.area}
              </p>
              <p className="text-gray-700">
                Skills: {app.worker?.skills?.join(", ")}
              </p>
              <p className="text-gray-700">
                Expected Rate: Rs. {app.worker?.expectedRate}
              </p>
            </div>

            <span className="self-start px-3 py-0.5 rounded-full bg-green-200 text-green-800 border">
              {app.status.toUpperCase()}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex gap-3 flex-wrap">
            {app.status === "pending" && (
              <>
                <button
                  onClick={() => handleAction(app._id, "accept")}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAction(app._id, "reject")}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}

            {app.status === "accepted" && (
              <>
                <a
                  href={`tel:${app.worker?.phone}`}
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
                >
                  Contact Worker
                </a>
                <button
                  onClick={() => markCompleted(app._id)}
                  className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-primary"
                >
                  Mark Completed
                </button>
              </>
            )}
          </div>

          {/* RATING */}
          {app.status === "completed" && !app.employerRating && (
            <div className="mt-6 border-t pt-4">
              <p className="font-semibold mb-2 text-primary">
                Rate this worker
              </p>

              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setRatingData((prev) => ({
                        ...prev,
                        [app._id]: {
                          ...prev[app._id],
                          stars: n,
                        },
                      }))
                    }
                    className={`px-3 py-1 rounded-lg border-2 text-sm font-medium transition ${
                      ratingData[app._id]?.stars >= n
                        ? "bg-yellow-400 text-white border-yellow-500"
                        : "bg-gray-200 text-gray-700 border-gray-300"
                    }`}
                  >
                    {n} ★
                  </button>
                ))}
              </div>

              <textarea
                className="w-full border rounded-lg px-4 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#16697A]"
                placeholder="Optional review"
                rows={3}
                value={ratingData[app._id]?.review || ""}
                onChange={(e) =>
                  setRatingData((prev) => ({
                    ...prev,
                    [app._id]: {
                      ...prev[app._id],
                      review: e.target.value,
                    },
                  }))
                }
              />

              <button
                onClick={() => submitRating(app._id)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
              >
                Submit Rating
              </button>
            </div>
          )}

          {app.employerRating && (
            <div className="mt-4 border-t pt-2">
              <p className="text-green-600 font-semibold">
                ★ Rated {app.employerRating.stars}/5
              </p>
              {app.employerRating.review && (
                <p className="text-gray-700 mt-1">
                  {app.employerRating.review}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
