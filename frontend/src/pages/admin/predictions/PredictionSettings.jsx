import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlatforms, getLeaguesByPlatform } from "../../../services/adminApi";
import "./PredictionSettings.css";
import { getImageUrl } from "../../../utils/getImageUrl";

export default function PredictionSettings() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function loadPlatforms() {
    try {
      setLoading(true);
      setError("");

      const res = await getPlatforms();

      // ✅ SAFE RESPONSE HANDLING (works for both raw and { data })
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      const enriched = await Promise.all(
        data.map(async (platform) => {
          try {
            const leaguesRes = await getLeaguesByPlatform(platform._id);

            // ✅ FIXED: consistent handling
            const leagues = Array.isArray(leaguesRes?.data)
              ? leaguesRes.data
              : Array.isArray(leaguesRes)
                ? leaguesRes
                : [];

            const modeCount = {
              AUTO: 0,
              MANUAL: 0,
              SEMI_AUTO: 0,
            };

            // ✅ FIXED: normalize mode (prevents silent bugs)
            leagues.forEach((l) => {
              const mode = (l.mode || "").toUpperCase();

              if (modeCount[mode] !== undefined) {
                modeCount[mode]++;
              }
            });

            return {
              ...platform,
              leagueCount: leagues.length,
              modeCount,
              hasLeagueError: false,
            };
          } catch (err) {
            console.error(
              `Failed to fetch leagues for platform ${platform._id}`,
              err,
            );

            // ✅ FIXED: don't lie with fake 0
            return {
              ...platform,
              leagueCount: null,
              modeCount: null,
              hasLeagueError: true,
            };
          }
        }),
      );

      setPlatforms(enriched);
    } catch (err) {
      console.error(err);
      setError("Failed to load platforms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlatforms();
  }, []);

  function openPlatform(platformId) {
    navigate(`/admin/predictions/${platformId}/leagues`);
  }

  // ✅ BETTER LOADING HANDLING
  if (loading) {
    return (
      <div className="prediction-settings-page">
        <p>Loading platforms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-settings-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="prediction-settings-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Prediction Settings</h2>
          <p>Select a platform to manage its leagues and prediction flow</p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {platforms.length === 0 && <p className="empty">No platforms found</p>}

      {/* GRID */}
      <div className="platform-grid">
        {platforms.map((p) => (
          <div
            key={p._id}
            className="platform-card clickable"
            onClick={() => openPlatform(p._id)}
          >
            {/* LOGO + NAME */}
            <div className="platform-top">
              <div className="platform-logo">
                {p.logo ? (
                  <img src={getImageUrl(p.logo)} />
                ) : (
                  <span>{p.name?.charAt(0)}</span>
                )}
              </div>

              <div>
                <h3>{p.name}</h3>
                <p>{p.country || "No country"}</p>
              </div>
            </div>

            {/* STATUS */}
            <span className={`status ${p.isActive ? "active" : "inactive"}`}>
              {p.isActive ? "Active" : "Inactive"}
            </span>

            {/* STATS */}
            <div className="platform-stats">
              {p.hasLeagueError ? (
                <p className="error">Failed to load leagues</p>
              ) : (
                <>
                  <p>
                    Total Leagues:{" "}
                    {p.leagueCount !== null ? p.leagueCount : "..."}
                  </p>

                  <div className="mode-count">
                    <span>AUTO: {p.modeCount?.AUTO || 0}</span>
                    <span>MANUAL: {p.modeCount?.MANUAL || 0}</span>
                    <span>SEMI: {p.modeCount?.SEMI_AUTO || 0}</span>
                  </div>
                </>
              )}
            </div>

            {/* CTA */}
            <div className="enter-btn">Manage Leagues →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
