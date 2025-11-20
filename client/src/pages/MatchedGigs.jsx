// MatchedGigs.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { getFairWage, isExploitative } from "../utils/fairWage";

const MatchedGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // <--- add this

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      try {
        const token = localStorage.getItem("token");

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
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">
        Matched Gigs
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gigs.map((gig) => {
          const fair = getFairWage(gig.location, gig.skill);
          const exploitative = isExploitative(gig.offeredRate, fair);

          return (
            <div
              key={gig._id}
              onClick={() => navigate(`/gigs/${gig._id}`)} // <--- navigate to gig detail
              className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2">{gig.title}</h2>
              <p className="text-gray-600 mb-2">{gig.description}</p>
              <p className="text-gray-500 text-sm mb-1">
                Skill:{" "}
                <span className="font-medium text-gray-700">{gig.skill}</span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                Location:{" "}
                <span className="font-medium text-gray-700">
                  {typeof gig.location === "string"
                    ? gig.location
                    : `${gig.location.area} - ${gig.location.district}`}
                </span>
              </p>
              <p className="text-gray-500 text-sm mb-1">
                Offered Rate:{" "}
                <span className="font-medium text-gray-700">
                  NPR {gig.offeredRate}
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
