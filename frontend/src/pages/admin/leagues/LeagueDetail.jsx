import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLeagueById, updateLeague } from "../../../services/adminApi";
import "./LeagueDetail.css";
import { getImageUrl } from "../../../utils/getImageUrl";

export default function LeagueDetail() {
  const { leagueId } = useParams();
  const navigate = useNavigate();

  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeague = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getLeagueById(leagueId);

      // ✅ SAFE RESPONSE HANDLING
      const data = res?.data || res;

      setLeague(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load league");
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadLeague();
  }, [loadLeague]);

  function goBack() {
    navigate(-1);
  }

  function goToEdit() {
    navigate(`/admin/leagues/${leagueId}/edit`);
  }

  function goToPredictions() {
    navigate(`/admin/leagues/${leagueId}/predictions`);
  }

  // ✅ CLEANER + safer dependency
  const toggleStatus = useCallback(async () => {
    setLeague((prev) => {
      if (!prev) return prev;

      const newStatus = !prev.isActive;

      // 🔥 trigger API inside state update (safe)
      updateLeague(leagueId, { isActive: newStatus }).catch((err) => {
        console.error(err);
        setError("Failed to update status");
      });

      return {
        ...prev,
        isActive: newStatus,
      };
    });
  }, [leagueId]);

  // ✅ STATES
  if (loading) {
    return (
      <div className="league-detail-page">
        <p>Loading league...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-detail-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!league) return null;

  const mode = (league.mode || "").toUpperCase();

  const formattedDate = league.firstPredictionTime
    ? new Date(league.firstPredictionTime).toLocaleString()
    : "N/A";

  return (
    <div className="league-detail-page">
      {/* HEADER */}
      <div className="detail-header">
        <button onClick={goBack}>← Back</button>

        <div className="title">
          <h2>{league.leagueName || "Unnamed League"}</h2>
          <p>{league.platform || "No platform"}</p>
        </div>

        <div className="header-actions">
          <button onClick={goToEdit}>Edit</button>
          <button onClick={toggleStatus}>
            {league.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* TOP CARD */}
      <div className="detail-card">
        {/* LEAGUE BANNER */}
        {league.logo && (
          <div className="league-banner">
            <img
              src={getImageUrl(league.logo)}
              alt={league.leagueName}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="top">
          {/* PLATFORM SUB-IMAGE */}
          <div className="logo">
            {league.platformId?.logo ? (
              <img
                src={getImageUrl(league.platformId.logo)}
                alt={league.platformId.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>{league.platform?.charAt(0)}</span>
            )}
          </div>

          <div>
            <h3>{league.leagueName}</h3>
            <p>{league.platformId?.name || league.platform}</p>
          </div>
        </div>

        <span className={`status ${league.isActive ? "active" : "inactive"}`}>
          {league.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* CONFIG */}
      <div className="detail-grid">
        <div className="box">
          <h4>Mode</h4>
          <p className={`mode ${mode.toLowerCase()}`}>{mode || "N/A"}</p>
        </div>

        <div className="box">
          <h4>Total Matches</h4>
          <p>{league.totalMatches || 0}</p>
        </div>

        <div className="box">
          <h4>Interval</h4>
          <p>{league.intervalMinutes || 0} mins</p>
        </div>

        <div className="box">
          <h4>First Prediction</h4>
          <p>{formattedDate}</p>
        </div>

        <div className="box">
          <h4>Teams</h4>
          <p>{league.teams?.length || 0}</p>
        </div>
      </div>

      {/* TEAMS */}
      <div className="detail-card">
        <h4>Teams</h4>
        <div className="teams">
          {league.teams?.map((t, i) => (
            <span key={i}>
              {t.name} {t.shortName && `(${t.shortName})`}
            </span>
          ))}
        </div>
      </div>

      {/* CYCLES */}
      <div className="detail-card">
        <h4>Cycle Configuration</h4>

        <div className="cycles">
          {league.cycleConfig?.map((c, i) => (
            <div key={i} className="cycle">
              <span>{c.name}</span>
              <span>
                {c.start}
                {c.max ? ` / ${c.max}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SEMI AUTO */}
      {mode === "SEMI_AUTO" && league.oddRange && (
        <div className="detail-card">
          <h4>Odd Range</h4>
          <p>
            {league.oddRange.min} - {league.oddRange.max}
          </p>
        </div>
      )}

      {/* ACTION */}
      <button className="prediction-btn" onClick={goToPredictions}>
        Open Predictions →
      </button>
    </div>
  );
}
