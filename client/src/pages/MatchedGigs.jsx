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
        const response = await axios.get("/match/gigs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGigs(response.data);
      } catch (err) {
        console.error("Failed to fetch matched gigs:", err);
        setError("Failed to load gigs. Try again later.");
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
          const fair = getFairWage(gig.location, gig.skill);
          const offered = Number(gig.offeredRate);
          const exploitative = isExploitative(offered, fair, 0.95);

          const locationStr =
            typeof gig.location === "string"
              ? gig.location
              : `${gig.location.district || "Unknown District"}, ${
                  gig.location.area || "Unknown Area"
                }`;

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
                Skill:{" "}
                <span className="font-medium text-secondary">{gig.skill}</span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                Location:{" "}
                <span className="font-medium text-secondary">
                  {locationStr}
                </span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                Offered Rate:{" "}
                <span className="font-medium text-secondary">
                  NPR {offered}
                </span>
              </p>
              <p
                className={`text-sm font-medium ${
                  exploitative ? "text-red-500" : "text-green-500"
                }`}
              >
                {exploitative ? "Exploitative Rate ⚠️" : "Fair Rate ✅"} (
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
