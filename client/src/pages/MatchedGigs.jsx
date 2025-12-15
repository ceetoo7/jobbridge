// MatchedGigs.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { getFairWage, isExploitative } from "../utils/fairWage";

const MatchedGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch worker profile
        const workerRes = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const worker = workerRes.data;
        if (!worker || !worker.skills || !worker.location) {
          throw new Error("Worker profile not found");
        }

        // Fetch all gigs
        const gigsRes = await axios.get("/gigs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allGigs = gigsRes.data;

        // Apply matching score logic
        const matched = allGigs.filter((gig) => {
          let score = 0;

          // Skill match (5 points)
          const skillMatch = gig.skills?.some((s) => worker.skills.includes(s));
          if (skillMatch) score += 5;
          else return false; // Must match skill, otherwise reject

          // Location match (2.5 points)
          const locMatch =
            gig.location?.district === worker.location.district ||
            gig.location?.area === worker.location.area;
          if (locMatch) score += 2.5;

          // Wage match (2.5 points)
          const wageMatch = gig.offeredRate >= worker.expectedRate;
          if (wageMatch) score += 2.5;

          return score >= 7.5;
        });

        setGigs(matched);
      } catch (err) {
        console.error("Failed to fetch matched gigs:", err);
        setError(err.message || "Failed to load gigs. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedGigs();
  }, [navigate]);

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

          const locationStr =
            gig.location && gig.location.district
              ? `${gig.location.district}, ${
                  gig.location.area || "Unknown Area"
                }`
              : "Unknown Location";

          return (
            <div
              key={gig._id}
              onClick={() => navigate(`/gigs/${gig._id}`)}
              className={`bg-background shadow-xl m-2 rounded-xl p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-10 ${
                exploitative ? "border-red-500" : "border-green-500"
              }`}
            >
              <h2 className="text-xl font-semibold mb-2 text-primary">
                {gig.title}
              </h2>
              <p className="text-gray-700 mb-2">{gig.description}</p>
              <p className="text-gray-500 text-sm mb-1">
                <strong>Skills:</strong>{" "}
                <span className="font-medium text-secondary">
                  {gig.skills?.join(", ") || "N/A"}
                </span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                <strong>Location:</strong>{" "}
                <span className="font-medium text-secondary">
                  {locationStr}
                </span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                <strong>Offered Rate:</strong>{" "}
                <span className="font-medium text-secondary">
                  NPR {offered.toLocaleString()}
                </span>
              </p>
              <p
                className={`text-sm font-medium ${
                  exploitative ? "text-red-500" : "text-green-500"
                }`}
              >
                {exploitative ? "Low Rate" : "Fair Rate"} (
                {fair ?? "N/A"})
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchedGigs;
