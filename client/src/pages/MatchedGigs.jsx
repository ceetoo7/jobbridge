import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { getFairWage, isExploitative } from "../utils/fairWage";

const MatchedGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchInfo, setMatchInfo] = useState({
    hasCV: false,
    algorithm: "traditional",
    totalMatches: 0,
  });
  const [algorithmMode, setAlgorithmMode] = useState("traditional");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const endpoint =
          algorithmMode === "vector" ? "/match/gigs/vector" : "/match/gigs/traditional";
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Handle different response formats
        const matches = response.data.matches || response.data;
        setGigs(matches);
        setMatchInfo({
          hasCV: response.data.hasCV || false,
          algorithm: response.data.algorithm || algorithmMode,
          totalMatches: response.data.totalMatches || matches.length,
        });
      } catch (err) {
        console.error("Failed to fetch matched gigs:", err);
        if (err.response?.status === 400 && algorithmMode === "vector") {
          setError("Please upload your CV first to use vector-based matching.");
        } else {
          setError(err.response?.data?.message || "Failed to load gigs");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedGigs();
  }, [navigate, token, algorithmMode]);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          🎯 Smart Gig Matches
        </h1>
        <p className="text-gray-600 mb-4">
          {algorithmMode === "traditional"
            ? "Traditional Matching (Profile Skills)"
            : "AI Vector Matching (CV + Gig Details)"}
        </p>

        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setAlgorithmMode("traditional")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              algorithmMode === "traditional"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Traditional
          </button>
          <button
            onClick={() => setAlgorithmMode("vector")}
            disabled={!matchInfo.hasCV}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              algorithmMode === "vector"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } ${!matchInfo.hasCV ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Vector {!matchInfo.hasCV ? "(No CV)" : ""}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            {algorithmMode === "traditional" ? (
              <>
                <strong>Traditional Matching:</strong> Matches worker profile skills
                with gig skill tags, then prioritizes better location/rate fit.
              </>
            ) : (
              <>
                <strong>AI Vector Matching:</strong> Matches CV content with gig
                details after skill-tag filtering.
              </>
            )}
          </p>
        </div>

        {!matchInfo.hasCV && algorithmMode === "vector" && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please upload your CV from your{" "}
              <button
                onClick={() => navigate("/profile")}
                className="underline font-medium"
              >
                Profile
              </button>{" "}
              to use AI Vector matching.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-center mb-6">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Results Count */}
      {gigs.length > 0 && (
        <p className="text-center text-gray-500 mb-4">
          Found {matchInfo.totalMatches} matching gigs
        </p>
      )}

      {/* Gigs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gigs.map((gig) => {
          const skillForFair = gig.skills?.[0] || "Unknown";
          const fair = getFairWage(gig.location, skillForFair);
          const offered = Number(gig.offeredRate);
          const exploitative = isExploitative(offered, fair, 0.95);

          const locationStr = gig.location?.district
            ? `${gig.location.district}, ${gig.location.area || "Unknown Area"}`
            : "Unknown Location";

          return (
            <div
              key={gig._id}
              className={`bg-background shadow-lg rounded-xl p-6 border-l-8 ${
                exploitative ? "border-red-500" : "border-green-500"
              } hover:shadow-xl transition-shadow`}
            >
              <div
                onClick={() => navigate(`/gigs/${gig._id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2 text-primary">
                  {gig.title}
                </h2>

                <p className="text-gray-700 mb-3 line-clamp-2">
                  {gig.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {gig.skill || gig.skills?.[0] || "N/A"}
                    </span>
                  </p>

                  <p className="text-sm text-gray-500">
                    <strong>📍</strong> {locationStr}
                  </p>

                  <p className="text-sm text-gray-500">
                    <strong>💰</strong> NPR {offered.toLocaleString()} / day
                  </p>

                  {fair && (
                    <p
                      className={`text-sm font-medium ${
                        exploitative ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {exploitative ? "⚠️ Below" : "✓ Meets"} fair rate (NPR{" "}
                      {fair}/day)
                    </p>
                  )}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => navigate(`/gigs/${gig._id}`)}
                className="w-full mt-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
              >
                View & Apply
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && gigs.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No matching gigs found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Try uploading your CV and make sure your profile skills are updated.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition"
          >
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchedGigs;
