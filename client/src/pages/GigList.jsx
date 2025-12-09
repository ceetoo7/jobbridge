import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFairWage, isExploitative } from "../utils/fairWage.js";
import { LOCATIONS } from "../utils/locations";

export default function GigList() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default worker location from localStorage
  const savedLocation = JSON.parse(localStorage.getItem("workerLocation")) || {
    district: "",
    area: "",
  };
  const [district, setDistrict] = useState(savedLocation.district);
  const [area, setArea] = useState(savedLocation.area);

  const fetchGigs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/gigs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load gigs");
      const data = await res.json();

      // Filter gigs by selected location
      const matchedGigs = data.filter((gig) => {
        const gigDistrict = gig.location?.district?.trim();
        const gigArea = gig.location?.area?.trim();
        return gigDistrict === district && gigArea === area;
      });

      setGigs(matchedGigs);
    } catch (err) {
      console.error("Gig fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch gigs on mount or whenever district/area changes
  useEffect(() => {
    fetchGigs();
  }, [district, area]);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading gigs...</p>;
  return (
    <div className="max-w-6xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-primary">
        Available Gigs
      </h2>

      {/* Location Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 font-semibold text-secondary">
            District:
          </label>
          <select
            className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setArea(""); // reset area when district changes
            }}
          >
            <option value="">Select District</option>
            {Object.keys(LOCATIONS).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-secondary">
            Area:
          </label>
          <select
            className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            disabled={!district}
          >
            <option value="">Select Area</option>
            {district &&
              LOCATIONS[district]?.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>
        </div>
      </div>

      {gigs.length === 0 ? (
        <p className="text-center text-highlight font-medium">
          No gigs available for the selected location.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gigs.map((gig) => {
            const fair = getFairWage(gig.location, gig.skill);
            const exploitative = isExploitative(gig.offeredRate, fair);

            return (
              <div
                key={gig._id}
                onClick={() => navigate(`/gigs/${gig._id}`)}
                className={`p-6 rounded-2xl shadow-md border-l-10 transition cursor-pointer bg-background hover:shadow-xl hover:bg-highlight ${
                  exploitative ? "border-red-500" : "border-green-500"
                }`}
              >
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {gig.title}
                </h3>
                <p className="text-gray-600 mb-1">{gig.description}</p>
                <p className="text-gray-500 text-sm mb-1">
                  <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
                </p>
                <p className="text-gray-500 text-sm mb-1">
                  <strong>Skill:</strong> {gig.skill}
                </p>
                <p className="text-gray-500 text-sm mb-1">
                  <strong>Location:</strong>{" "}
                  {gig.location
                    ? `${gig.location.district}, ${gig.location.area}`
                    : "N/A"}
                </p>
                <p className="text-gray-500 text-sm mb-1">
                  <strong>Offered Rate:</strong> NPR{" "}
                  {Number(gig.offeredRate).toLocaleString()}
                </p>
                <p className="text-green-500 text-sm mb-2">
                  <strong>Fair Rate:</strong> NPR{" "}
                  {fair != null ? fair.toLocaleString() : "N/A"}
                </p>
                {exploitative && (
                  <p className="text-red-500 font-semibold text-sm">
                    ⚠️ Below 90% of fair wage
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
