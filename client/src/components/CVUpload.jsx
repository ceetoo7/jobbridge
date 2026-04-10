import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * CV Upload Component
 * Allows workers to upload their CV for vector-based matching
 */
export default function CVUpload() {
  const [cvText, setCvText] = useState('');
  const [cvProfile, setCvProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing CV profile on mount
  useEffect(() => {
    fetchCVProfile();
  }, []);

  const fetchCVProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cv/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCvProfile(response.data);
    } catch (err) {
      console.error('Error fetching CV profile:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvText.trim()) {
      setError('Please enter your CV text');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/cv/upload`,
        { cvText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('CV uploaded successfully! Vector profile created.');
      setCvText('');
      setCvProfile(prev => ({
        ...prev,
        hasCV: true,
        cvSummary: response.data.cvSummary,
        cvUploadedAt: response.data.cvUploadedAt
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your CV?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/cv/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('CV deleted successfully');
      setCvProfile(null);
    } catch (err) {
      setError('Failed to delete CV');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">📄 CV Upload & Vector Profile</h2>

        <p className="text-gray-600 mb-6">
          Upload your CV to enable <strong>AI-powered vector matching</strong>.
          Our algorithm analyzes your experience and matches you with relevant gigs
          based on semantic similarity, not just keywords.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Existing CV Profile */}
        {cvProfile?.hasCV && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-blue-900">✅ Vector Profile Active</h3>
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete CV
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Word Count:</span>
                <span className="ml-2 font-medium">{cvProfile.cvSummary?.wordCount || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Detected Skills:</span>
                <span className="ml-2 font-medium">
                  {cvProfile.cvSummary?.detectedSkills?.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Experience:</span>
                <span className="ml-2 font-medium">
                  {cvProfile.cvSummary?.experienceMentions?.slice(0, 2).join(', ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Uploaded:</span>
                <span className="ml-2 font-medium">
                  {cvProfile.cvUploadedAt ? new Date(cvProfile.cvUploadedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!cvProfile?.hasCV && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Paste Your CV Text
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV content here. Include your skills, experience, education, and any other relevant information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={10}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Upload & Create Vector Profile'}
              </button>

              <span className="text-sm text-gray-500">
                {cvText.split(/\s+/).filter(w => w.length > 0).length} words
              </span>
            </div>
          </form>
        )}

        {/* Update CV Button */}
        {cvProfile?.hasCV && (
          <form onSubmit={handleSubmit} className="mt-6 border-t pt-6">
            <h3 className="font-semibold mb-3">Update CV</h3>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste updated CV content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
            <button
              type="submit"
              disabled={loading || !cvText.trim()}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update CV'}
            </button>
          </form>
        )}

        {/* How it Works */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">🧠 How Vector Matching Works</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <strong>1. TF-IDF Analysis:</strong> Your CV is analyzed to identify important terms and their frequencies.
            </li>
            <li>
              <strong>2. Vector Generation:</strong> A mathematical vector is created representing your skills and experience.
            </li>
            <li>
              <strong>3. Cosine Similarity:</strong> Your CV vector is compared with gig description vectors to find semantic matches.
            </li>
            <li>
              <strong>4. Skill-Gated Results:</strong> Only gigs with matching skill tags are shown, then ranked by vector relevance.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
