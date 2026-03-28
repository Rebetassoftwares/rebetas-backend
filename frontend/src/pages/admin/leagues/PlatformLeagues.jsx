import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPlatformById,
  getLeaguesByPlatform,
} from "../../../services/adminApi";
import "./PlatformLeagues.css";

export default function PlatformLeagues() {
  const { platformId } = useParams();
  const navigate = useNavigate();

  const [platform, setPlatform] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [platformRes, leaguesRes] = await Promise.all([
        getPlatformById(platformId),
        getLeaguesByPlatform(platformId),
      ]);

      // ✅ SAFE RESPONSE HANDLING
      const platformData = platformRes?.data || platformRes;

      const leaguesData = Array.isArray(leaguesRes?.data)
        ? leaguesRes.data
        : Array.isArray(leaguesRes)
          ? leaguesRes
          : [];

      setPlatform(platformData);
      setLeagues(leaguesData);
    } catch (err) {
      console.error(err);
      setError("Failed to load platform leagues");
    } finally {
      setLoading(false);
    }
  }, [platformId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function goBack() {
    navigate("/admin/predictions");
  }

  function goToCreate() {
    navigate(`/admin/leagues/create?platformId=${platformId}`);
  }

  function goToEdit(id) {
    navigate(`/admin/leagues/${id}/edit`);
  }

  function goToDetail(id) {
    navigate(`/admin/leagues/${id}`);
  }

  function goToPredictions(id) {
    navigate(`/admin/leagues/${id}/predictions`);
  }

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="leagues-page">
        <p>Loading leagues...</p>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="leagues-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="leagues-page">
      {/* HEADER */}
      <div className="page-header">
        <button onClick={goBack}>← Back</button>

        <div>
          <h2>{platform?.name || "Platform"}</h2>
          <p>Manage leagues under this platform</p>
        </div>

        <button className="btn-primary" onClick={goToCreate}>
          + Add League
        </button>
      </div>

      {/* EMPTY STATE */}
      {leagues.length === 0 && (
        <p className="empty">No leagues found for this platform</p>
      )}

      {/* LEAGUES */}
      <div className="league-grid">
        {leagues.map((l) => {
          const mode = (l.mode || "").toUpperCase();

          return (
            <div key={l._id} className="league-card">
              {/* TOP */}
              <div className="league-top">
                <div className="league-logo">
                  {l.logo ? (
                    <img src={l.logo} alt={l.leagueName} />
                  ) : (
                    <span>{l.leagueName?.charAt(0)}</span>
                  )}
                </div>

                <div>
                  <h3>{l.leagueName}</h3>
                  <p>{l.platformId?.name || l.platform}</p>
                </div>
              </div>

              {/* MODE */}
              <span className={`mode ${mode.toLowerCase()}`}>
                {mode || "N/A"}
              </span>

              {/* STATUS */}
              <span className={`status ${l.isActive ? "active" : "inactive"}`}>
                {l.isActive ? "Active" : "Inactive"}
              </span>

              {/* CONFIG */}
              <div className="league-info">
                <p>Matches: {l.totalMatches || 0}</p>
                <p>Interval: {l.intervalMinutes || 0} mins</p>
                <p>Teams: {Array.isArray(l.teams) ? l.teams.length : 0}</p>
              </div>

              {/* CYCLES */}
              <div className="cycles">
                {l.cycleConfig?.map((c, i) => (
                  <span key={i}>
                    {c.name}: {c.start}
                    {c.max ? ` / ${c.max}` : ""}
                  </span>
                ))}
              </div>

              {/* SEMI AUTO */}
              {mode === "SEMI_AUTO" && l.oddRange && (
                <div className="odd-range">
                  Odds: {l.oddRange.min} - {l.oddRange.max}
                </div>
              )}

              {/* ACTIONS */}
              <div className="actions">
                <button onClick={() => goToDetail(l._id)}>Details</button>
                <button onClick={() => goToEdit(l._id)}>Edit</button>
              </div>

              {/* NAV */}
              <button
                className="view-btn"
                onClick={() => goToPredictions(l._id)}
              >
                Open Predictions →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
