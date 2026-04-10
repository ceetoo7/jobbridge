import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Enhanced Gig Matches Component
 * Shows matches with vector-based scoring and algorithm explanations
 */
export default function EnhancedGigMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [algorithm, setAlgorithm] = useState('hybrid');
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [algorithm]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = algorithm === 'hybrid' ? '/api/match/gigs' :
                       algorithm === 'vector' ? '/api/match/gigs/vector' :
                       '/api/match/gigs/traditional';

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMatches(response.data.matches || response.data);
      setHasCV(response.data.hasCV);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">🎯 Smart Gig Matches</h2>
            <p className="text-gray-600 text-sm mt-1">
              Powered by {algorithm === 'hybrid' ? 'Hybrid (Vector + Traditional)' :
                          algorithm === 'vector' ? 'Vector-Based AI' : 'Traditional'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAlgorithm('hybrid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                algorithm === 'hybrid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setAlgorithm('vector')}
              disabled={!hasCV}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                algorithm === 'vector'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${!hasCV ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Vector Only {!hasCV && '(No CV)'}
            </button>
            <button
              onClick={() => setAlgorithm('traditional')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                algorithm === 'traditional'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Traditional
            </button>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900">
                {algorithm === 'hybrid' ? 'Hybrid Matching Algorithm' :
                 algorithm === 'vector' ? 'Vector-Based Matching (AI)' :
                 'Traditional Weighted Matching'}
              </h4>
              <p className="text-blue-800 text-sm mt-1">
                {algorithm === 'hybrid'
                  ? 'Combines CV content analysis (50%) with skills, location, and rate matching (50%) for the most accurate results.'
                  : algorithm === 'vector'
                  ? 'Uses TF-IDF and Cosine Similarity to analyze your CV against gig descriptions. Finds semantic matches beyond keywords.'
                  : 'Traditional matching based on explicit skill tags, location, and wage requirements.'}
              </p>
            </div>
          </div>
        </div>

        {!hasCV && algorithm === 'vector' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ Please upload your CV first to use Vector-Based matching.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Calculating matches...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No matching gigs found. Try adjusting your skills or upload a CV for better matches.
          </div>
        )}

        <div className="space-y-4">
          {matches.map((gig) => (
            <div
              key={gig._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{gig.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {gig.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {gig.skill || gig.skills?.[0]}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Rs. {gig.offeredRate}/day
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {gig.location?.district}, {gig.location?.area}
                    </span>
                  </div>
                </div>

                {/* Match Score */}
                <div className="ml-4 text-right">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(gig.matchScore || gig.vectorScore || 0) * 1.76} 176`}
                        className={`${getScoreColor(gig.matchScore || gig.vectorScore || 0)} transition-all duration-1000`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {gig.matchScore || gig.vectorScore || 0}%
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${
                    (gig.matchScore || gig.vectorScore || 0) >= 60 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {getScoreLabel(gig.matchScore || gig.vectorScore || 0)}
                  </span>
                </div>
              </div>

              {/* Score Breakdown (for hybrid) */}
              {algorithm === 'hybrid' && gig.scoringDetails && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      Vector: <strong>{gig.vectorScore}%</strong>
                    </span>
                    <span>
                      Traditional: <strong>{Math.round(gig.traditionalScore)}%</strong>
                    </span>
                    <div className="flex gap-2">
                      {gig.scoringDetails?.skillMatch && <span className="text-green-600">✓ Skill</span>}
                      {gig.scoringDetails?.locationMatch && <span className="text-green-600">✓ Location</span>}
                      {gig.scoringDetails?.rateMatch && <span className="text-green-600">✓ Rate</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                Apply Now
              </button>
            </div>
          ))}
        </div>

        {/* Total Results */}
        {!loading && matches.length > 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Showing {matches.length} matches
          </p>
        )}
      </div>
    </div>
  );
}
