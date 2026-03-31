import { useEffect, useState, useCallback } from "react";
import {
  getLivePredictions,
  updatePredictionResult,
  getPlatforms,
} from "../../../services/adminApi";
import "./LivePredictions.css";
import { getImageUrl } from "../../../utils/getImageUrl";

export default function LivePredictions() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platformMap, setPlatformMap] = useState({});
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // GROUPING LOGIC
  const groupPredictions = useCallback((data) => {
    const groupedData = {};

    data.forEach((p) => {
      const platform = p.platform || "Unknown Platform";
      const league = p.leagueName || "Unknown League";

      if (!groupedData[platform]) {
        groupedData[platform] = {};
      }

      if (!groupedData[platform][league]) {
        groupedData[platform][league] = [];
      }

      groupedData[platform][league].push(p);
    });

    return groupedData;
  }, []);

  // LOAD DATA
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getLivePredictions();

      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      const groupedData = groupPredictions(data);
      setGrouped(groupedData);
    } catch (err) {
      console.error(err);
      setError("Failed to load live predictions");
    } finally {
      setLoading(false);
    }
  }, [groupPredictions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function loadPlatformsData() {
      try {
        const res = await getPlatforms();

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        const map = {};

        data.forEach((p) => {
          map[p.name] = p;
        });

        setPlatformMap(map);
      } catch (err) {
        console.error("Platform map load error", err);
      }
    }

    loadPlatformsData();
  }, []);

  // ✅ FIXED RESULT UPDATE (NO FULL RELOAD)
  const handleResult = useCallback(
    async (id, status) => {
      // prevent double click
      if (updatingIds.has(id)) return;

      try {
        // mark as updating
        setUpdatingIds((prev) => new Set(prev).add(id));

        // 🔥 optimistic UI update
        setGrouped((prev) => {
          const updated = { ...prev };

          for (const platform in updated) {
            for (const league in updated[platform]) {
              updated[platform][league] = updated[platform][league].map((p) =>
                (p._id || p.id) === id ? { ...p, status } : p,
              );
            }
          }

          return updated;
        });

        await updatePredictionResult(id, { status });
      } catch (err) {
        console.error(err);
        setError("Update failed");
      } finally {
        // remove updating state
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [updatingIds],
  );

  if (loading) return <p>Loading live predictions...</p>;

  return (
    <div className="live-page">
      <h2>Live Predictions</h2>

      {error && <p className="error">{error}</p>}

      {Object.keys(grouped).length === 0 && <p>No active predictions</p>}

      {Object.entries(grouped).map(([platform, leagues]) => (
        <div key={platform} className="platform-block">
          <div className="platform-header">
            {platformMap[platform]?.logo && (
              <img
                src={getImageUrl(platformMap[platform].logo)}
                alt={platform}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            <h3>{platform}</h3>
          </div>

          {Object.entries(leagues).map(([league, preds]) => (
            <div key={league} className="league-block">
              <h4>{league}</h4>

              <div className="prediction-grid">
                {preds.length === 0 && <p>No predictions</p>}

                {preds.map((p) => (
                  <div key={p._id || p.id} className="prediction-card">
                    {p.type === "MANUAL" && (
                      <p>
                        #{p.matchNumber || "-"} — {p.homeTeam || "?"} vs{" "}
                        {p.awayTeam || "?"}
                      </p>
                    )}

                    {p.type === "SEMI_AUTO" && (
                      <p>{p.team || "?"} — Over 1.5 Goals</p>
                    )}

                    <p>Odd: {p.odd ?? "-"}</p>
                    <p>Stake: {p.stake ?? "-"}</p>

                    <div className="cycles">
                      {p.cycles?.map((c, i) => (
                        <span key={i}>
                          {c.name}: {c.value}
                        </span>
                      ))}
                    </div>

                    <p>Status: {p.status || "unknown"}</p>

                    {p.status === "pending" && (
                      <div className="actions">
                        <button onClick={() => handleResult(p._id, "won")}>
                          WON
                        </button>

                        <button onClick={() => handleResult(p._id, "loss")}>
                          LOSS
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
