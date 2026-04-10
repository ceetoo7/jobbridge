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
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = '/api/match/gigs';

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">🎯 Smart Gig Matches</h2>
            <p className="text-gray-600 text-sm mt-1">
              Powered by Vector-Based AI
            </p>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900">
                Vector-Based Matching (AI)
              </h4>
              <p className="text-blue-800 text-sm mt-1">
                Uses TF-IDF and cosine similarity to match your CV text with gig details, after strict skill-tag filtering.
              </p>
            </div>
          </div>
        </div>

        {!hasCV && (
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

              </div>

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
