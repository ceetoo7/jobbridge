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
    <div className="max-w-3xl mx-auto my-8 p-4">
      {" "}
      <h2 className="text-2xl font-bold mb-4 text-center">Available Gigs</h2>
      {/* Location Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block mb-1 font-semibold">District:</label>
          <select
            className="w-full p-2 border rounded"
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

        <div className="flex-1">
          <label className="block mb-1 font-semibold">Area:</label>
          <select
            className="w-full p-2 border rounded"
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
        <p className="text-center text-gray-500">
          No gigs available for your location.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {gigs.map((gig) => {
            const fair = getFairWage(gig.location, gig.skill);
            const exploitative = isExploitative(gig.offeredRate, fair);

            return (
              <div
                key={gig._id}
                onClick={() => navigate(`/gigs/${gig._id}`)}
                className={`p-4 rounded-xl shadow-md border-l-4 transition cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  exploitative ? "border-red-500" : "border-green-500"
                }`}
              >
                <h3 className="text-lg font-semibold mb-1">{gig.title}</h3>
                <p>
                  <strong>Employer:</strong> {gig.employer?.name || "Anonymous"}
                </p>
                <p>
                  <strong>Skill:</strong> {gig.skill}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {gig.location
                    ? `${gig.location.district}, ${gig.location.area}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Offered Rate:</strong> NPR{" "}
                  {Number(gig.offeredRate).toLocaleString()}
                </p>
                <p>
                  <strong>Fair Rate:</strong> NPR{" "}
                  {fair != null ? fair.toLocaleString() : "N/A"}
                </p>
                {exploitative && (
                  <p className="text-red-500 mt-1 font-semibold">
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
