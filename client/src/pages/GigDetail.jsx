import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { getFairWage } from "../utils/fairWage";

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState(""); // optional review
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get(`/gigs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = res.data;

        const firstSkill = data.skills?.[0] || "Unknown";
        const fair = getFairWage(data.location, firstSkill);
        const isExploitative = data.offeredRate < fair * 0.95;

        setGig({ ...data, fairRate: fair, isExploitative });

        // check if worker already applied
        setApplied(data.application ? true : false);

        // prefill rating if already exists
        if (data.application?.ratingEmployer?.stars) {
          setRating(data.application.ratingEmployer.stars);
          setReview(data.application.ratingEmployer.review || "");
          setRatingSubmitted(true);
        }
      } catch (err) {
        console.error("Fetch gig error:", err);
        alert("Failed to load gig. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id]);

  const handleApply = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as a worker to apply.");
      navigate("/login");
      return;
    }

    setApplying(true);
    try {
      const res = await axiosInstance.post(
        `/gigs/${id}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200 || res.status === 201) {
        alert("✅ Applied successfully!");
        setApplied(true);
      } else {
        alert(res.data.error || "Failed to apply.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Network error while applying.");
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating < 1 || rating > 5) {
      alert("Please select a rating from 1 to 5.");
      return;
    }

    if (!gig.application?._id) {
      alert("Application ID missing. Cannot submit rating.");
      return;
    }

    setSubmittingRating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.post(
        `/gigs/${id}/applicants/${gig.application._id}/rate-employer`,
        { stars: rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        alert("Rating submitted successfully!");
        setRatingSubmitted(true);
        // Update gig state so it shows submitted rating
        setGig({
          ...gig,
          application: {
            ...gig.application,
            ratingEmployer: { stars: rating, review },
          },
        });
      } else {
        alert("Failed to submit rating.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Network error submitting rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gig...</p>;
  if (!gig)
    return <p className="text-center mt-10 text-gray-500">Gig not found.</p>;

  const token = localStorage.getItem("token");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const isWorker = decoded?.role === "worker";
  const applicationStatus = gig.application?.status;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#EDE7E3] rounded-2xl shadow-lg mt-12">
      <h2 className="text-3xl font-bold mb-4 text-[#16697A]">{gig.title}</h2>

      <p className="text-gray-700 mb-2">
        <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Skills:</strong> {gig.skills?.join(", ") || "N/A"}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Location:</strong>{" "}
        {typeof gig.location === "string"
          ? gig.location
          : `${gig.location.area} - ${gig.location.district}`}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Offered Rate:</strong> NPR {gig.offeredRate.toLocaleString()}
      </p>
      <p className="text-gray-700 mb-4">
        <strong>Fair Rate:</strong> NPR{" "}
        {gig.fairRate?.toLocaleString() || "N/A"}
      </p>

      {gig.isExploitative ? (
        <p className="text-red-600 font-semibold mb-4">
          This gig is below fair wage.
        </p>
      ) : (
        <p className="text-green-600 font-semibold mb-4">
          This gig meets fair wage standards.
        </p>
      )}

      <p className="text-gray-700 mb-6">{gig.description}</p>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#489FB5] hover:bg-[#16697A] text-white px-5 py-2 rounded-lg transition"
        >
          ← Back
        </button>

        {isWorker && !applied && (
          <button
            onClick={handleApply}
            disabled={applying}
            className={`bg-[#FFA62B] hover:bg-[#FF8C00] text-white px-5 py-2 rounded-lg transition ${
              applying ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {applying ? "Applying..." : "Apply"}
          </button>
        )}

        {isWorker && applicationStatus === "pending" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 border-2 border-yellow-400 font-medium">
            Applied
          </span>
        )}

        {isWorker && applicationStatus === "accepted" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-200 text-blue-800 border-2 border-blue-400 font-medium">
            Accepted
          </span>
        )}

        {isWorker && applicationStatus === "completed" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-200 text-green-800 border-2 border-green-400 font-medium">
            Completed
          </span>
        )}
      </div>

      {/* Worker rating UI */}
      {isWorker && applicationStatus === "completed" && !ratingSubmitted && (
        <div className="mt-4">
          <p className="text-gray-700 font-semibold mb-2">
            Rate this employer:
          </p>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`inline-flex items-center px-3 py-1 rounded-lg border-2 text-sm font-medium transition ${
                  rating >= star
                    ? "bg-yellow-400 text-white border-yellow-500"
                    : "bg-gray-200 text-gray-700 border-gray-300"
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>

          <textarea
            placeholder="Optional review (can leave empty)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#16697A]"
          />

          <button
            onClick={handleSubmitRating}
            disabled={submittingRating}
            className="bg-[#16697A] hover:bg-[#0F5DD2] text-white px-5 py-2 rounded-lg transition"
          >
            {submittingRating ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}

      {/* Display submitted rating */}
      {isWorker &&
        applicationStatus === "completed" &&
        ratingSubmitted &&
        gig.application?.ratingEmployer && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <p className="font-semibold">Your rating:</p>
            <p>{gig.application.ratingEmployer.stars} ★</p>
            {gig.application.ratingEmployer.review && (
              <p>"{gig.application.ratingEmployer.review}"</p>
            )}
          </div>
        )}
    </div>
  );
}
