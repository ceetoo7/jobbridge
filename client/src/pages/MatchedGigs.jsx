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
    algorithm: "hybrid",
    totalMatches: 0,
  });
  const [algorithmMode, setAlgorithmMode] = useState("hybrid");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMatchedGigs = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        // Use the new hybrid matching endpoint
        const endpoint =
          algorithmMode === "hybrid"
            ? "/match/gigs"
            : algorithmMode === "vector"
              ? "/match/gigs/vector"
              : "/match/gigs/traditional";

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

  const getScoreColor = (score) => {
    if (!score && score !== 0) return "bg-gray-400";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (!score && score !== 0) return "Unknown";
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Low Match";
  };

  const submitRating = async (gigId, rating) => {
    try {
      await axios.post(
        "/ratings/worker-to-employer",
        { gigId, rating },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setGigs((prev) =>
        prev.map((g) => (g._id === gigId ? { ...g, workerRating: rating } : g)),
      );
    } catch (err) {
      alert("Rating failed. Try again.");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with Algorithm Selection */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          🎯 Smart Gig Matches
        </h1>
        <p className="text-gray-600 mb-4">
          Powered by{" "}
          {algorithmMode === "hybrid" &&
            "Hybrid Matching (Vector + Traditional)"}
          {algorithmMode === "vector" && "AI Vector Matching"}
          {algorithmMode === "traditional" && "Traditional Skill Matching"}
        </p>

        {/* Algorithm Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setAlgorithmMode("hybrid")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              algorithmMode === "hybrid"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Hybrid
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
            Vector {!matchInfo.hasCV && "(No CV)"}
          </button>
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
        </div>

        {/* Algorithm Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            {algorithmMode === "hybrid" && (
              <>
                💡 <strong>Hybrid Matching:</strong> Combines CV semantic
                analysis (50%) with skills, location, and rate matching (50%)
                for the most accurate results.
              </>
            )}
            {algorithmMode === "vector" && (
              <>
                <strong>AI Vector Matching:</strong> Uses TF-IDF and Cosine
                Similarity to analyze your CV content against gig descriptions.
                Finds semantic matches beyond keywords.
              </>
            )}
            {algorithmMode === "traditional" && (
              <>
                📋 <strong>Traditional Matching:</strong> Based on explicit
                skill tags, location matching, and wage requirements.
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

          const matchScore = gig.matchScore ?? 0;
          const hasDetailedScores =
            algorithmMode === "hybrid" &&
            (gig.vectorScore !== undefined ||
              gig.traditionalScore !== undefined);

          return (
            <div
              key={gig._id}
              className={`bg-background shadow-lg rounded-xl p-6 border-l-8 ${
                exploitative ? "border-red-500" : "border-green-500"
              } hover:shadow-xl transition-shadow`}
            >
              {/* Match Score Badge */}
              {matchScore > 0 && (
                <div className="flex justify-end mb-2">
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getScoreColor(
                        matchScore,
                      )} bg-opacity-20`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${getScoreColor(matchScore)}`}
                      />
                      <span className="text-sm font-bold">{matchScore}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getScoreLabel(matchScore)}
                    </p>
                  </div>
                </div>
              )}

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

              {/* Detailed Score Breakdown (for Hybrid) */}
              {hasDetailedScores && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Score Breakdown:
                  </p>
                  <div className="flex gap-3 text-xs">
                    {gig.vectorScore !== undefined && (
                      <span className="text-purple-600">
                        Vector: <strong>{gig.vectorScore}%</strong>
                      </span>
                    )}
                    {gig.traditionalScore !== undefined && (
                      <span className="text-green-600">
                        Traditional:{" "}
                        <strong>{Math.round(gig.traditionalScore)}%</strong>
                      </span>
                    )}
                  </div>
                  {gig.scoringDetails && (
                    <div className="flex gap-2 mt-2 text-xs">
                      {gig.scoringDetails.skillMatch && (
                        <span className="text-green-600">✓ Skill</span>
                      )}
                      {gig.scoringDetails.locationMatch && (
                        <span className="text-green-600">✓ Location</span>
                      )}
                      {gig.scoringDetails.rateMatch && (
                        <span className="text-green-600">✓ Rate</span>
                      )}
                    </div>
                  )}
                </div>
              )}

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
            Try uploading your CV for better AI-powered matching, or adjust your
            skills and expected rate in your profile.
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
