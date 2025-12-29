import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { getFairWage, isExploitative } from "../utils/fairWage";

const MatchedGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const workerRes = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const worker = workerRes.data;
        if (!worker || !worker.skills || !worker.location) {
          throw new Error("Worker profile not found");
        }

        const gigsRes = await axios.get("/gigs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allGigs = gigsRes.data;

        const matched = allGigs.filter((gig) => {
          let score = 0;

          const skillMatch = gig.skills?.some((s) => worker.skills.includes(s));
          if (!skillMatch) return false;
          score += 5;

          const locMatch =
            gig.location?.district === worker.location.district ||
            gig.location?.area === worker.location.area;
          if (locMatch) score += 2.5;

          const wageMatch = gig.offeredRate >= worker.expectedRate;
          if (wageMatch) score += 2.5;

          return score >= 7.5;
        });

        setGigs(matched);
      } catch (err) {
        console.error("Failed to fetch matched gigs:", err);
        setError(err.message || "Failed to load gigs");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedGigs();
  }, [navigate, token]);

  const submitRating = async (gigId, rating) => {
    try {
      await axios.post(
        "/ratings/worker-to-employer",
        { gigId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGigs((prev) =>
        prev.map((g) => (g._id === gigId ? { ...g, workerRating: rating } : g))
      );
    } catch (err) {
      alert("Rating failed. Try again.");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary">
        Matched Gigs
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gigs.map((gig) => {
          const skillForFair = gig.skills?.[0] || "Unknown";
          const fair = getFairWage(gig.location, skillForFair);
          const offered = Number(gig.offeredRate);
          const exploitative = isExploitative(offered, fair, 0.95);

          const locationStr = gig.location?.district
            ? `${gig.location.district}, ${gig.location.area || "Unknown Area"}`
            : "Unknown Location";

          const canRate = gig.status === "completed" && !gig.workerRating;

          return (
            <div
              key={gig._id}
              className={`bg-background shadow-lg rounded-xl p-6 border-l-8 ${
                exploitative ? "border-red-500" : "border-green-500"
              }`}
            >
              <div
                onClick={() => navigate(`/gigs/${gig._id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2 text-primary">
                  {gig.title}
                </h2>

                <p className="text-gray-700 mb-2">{gig.description}</p>

                <p className="text-sm text-gray-500">
                  <strong>Skills:</strong> {gig.skills?.join(", ") || "N/A"}
                </p>

                <p className="text-sm text-gray-500">
                  <strong>Location:</strong> {locationStr}
                </p>

                <p className="text-sm text-gray-500">
                  <strong>Offered Rate:</strong> NPR {offered.toLocaleString()}
                </p>

                <p
                  className={`text-sm font-medium ${
                    exploitative ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {exploitative ? "Low Rate" : "Fair Rate"} ({fair ?? "N/A"})
                </p>
              </div>

              {/* ⭐ WORKER → EMPLOYER RATING */}
              {canRate && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Rate Employer</p>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => submitRating(gig._id, star)}
                        className="text-xl hover:scale-110 transition"
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {gig.workerRating && (
                <p className="mt-3 text-sm text-green-600">
                  You rated this employer ⭐ {gig.workerRating}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchedGigs;
