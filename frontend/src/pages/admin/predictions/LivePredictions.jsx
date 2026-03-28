import { useEffect, useState, useCallback } from "react";
import {
  getLivePredictions,
  updatePredictionResult,
} from "../../../services/adminApi";
import "./LivePredictions.css";

export default function LivePredictions() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      // ✅ FIX: consistent response handling
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

  // RESULT UPDATE
  const handleResult = useCallback(
    async (id, status) => {
      try {
        await updatePredictionResult(id, { status });
        loadData();
      } catch (err) {
        console.error(err);
        setError("Update failed");
      }
    },
    [loadData],
  );

  if (loading) return <p>Loading live predictions...</p>;

  return (
    <div className="live-page">
      <h2>Live Predictions</h2>

      {error && <p className="error">{error}</p>}

      {/* EMPTY */}
      {Object.keys(grouped).length === 0 && <p>No active predictions</p>}

      {/* PLATFORM GROUP */}
      {Object.entries(grouped).map(([platform, leagues]) => (
        <div key={platform} className="platform-block">
          <h3>{platform}</h3>

          {/* LEAGUE GROUP */}
          {Object.entries(leagues).map(([league, preds]) => (
            <div key={league} className="league-block">
              <h4>{league}</h4>

              <div className="prediction-grid">
                {preds.length === 0 && <p>No predictions</p>}

                {preds.map((p) => (
                  <div key={p._id || p.id} className="prediction-card">
                    {/* TYPE */}
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

                    {/* CYCLES */}
                    <div className="cycles">
                      {p.cycles?.map((c, i) => (
                        <span key={i}>
                          {c.name}: {c.value}
                        </span>
                      ))}
                    </div>

                    <p>Status: {p.status || "unknown"}</p>

                    {/* ACTIONS */}
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
