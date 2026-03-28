import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getLeagueById,
  getPredictionsByLeague,
  createManualPrediction,
  updatePredictionResult,
} from "../../../services/adminApi";
import api from "../../../services/api";
import "./LeaguePredictions.css";

export default function LeaguePredictions() {
  const { leagueId } = useParams();

  const [league, setLeague] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    odd: "",
  });

  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const leagueRes = await getLeagueById(leagueId);

      // ✅ FIX
      const leagueData = leagueRes?.data || leagueRes;

      setLeague(leagueData);

      const mode = (leagueData.mode || "").toUpperCase();

      // AUTO MODE
      if (mode === "AUTO") {
        const res = await api.get(
          `/prediction/${leagueData.platform}/${leagueData.leagueName}`,
        );

        // ✅ FIX
        setPredictions(res ? [res] : []);
      } else {
        const res = await getPredictionsByLeague(leagueId);

        // ✅ FIX
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        setPredictions(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CREATE MANUAL
  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();

      // ✅ VALIDATION
      if (!form.homeTeam || !form.awayTeam || !form.odd) {
        setError("All fields are required");
        return;
      }

      try {
        await createManualPrediction({
          leagueId,
          homeTeam: form.homeTeam,
          awayTeam: form.awayTeam,
          odd: Number(form.odd),
        });

        setForm({ homeTeam: "", awayTeam: "", odd: "" });
        loadData();
      } catch (err) {
        console.error(err);
        setError("Create failed");
      }
    },
    [form.homeTeam, form.awayTeam, form.odd, leagueId, loadData], // ✅ FIXED deps
  );

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

  if (loading) return <p>Loading...</p>;
  if (!league) return null;

  const mode = (league.mode || "").toUpperCase();

  return (
    <div className="predictions-page">
      <h2>{league.leagueName} Predictions</h2>

      {error && <p className="error">{error}</p>}

      {/* AUTO MODE */}
      {mode === "AUTO" && (
        <div className="auto-box">
          <p>Live Prediction (AUTO)</p>

          {predictions[0] ? (
            <pre>{JSON.stringify(predictions[0], null, 2)}</pre>
          ) : (
            <p>No prediction available</p>
          )}

          <button onClick={loadData}>Refresh</button>
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === "MANUAL" && (
        <form className="create-form" onSubmit={handleCreate}>
          <input
            placeholder="Home Team"
            value={form.homeTeam}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, homeTeam: e.target.value }))
            }
          />
          <input
            placeholder="Away Team"
            value={form.awayTeam}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, awayTeam: e.target.value }))
            }
          />
          <input
            placeholder="Odd"
            value={form.odd}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, odd: e.target.value }))
            }
          />

          <button type="submit">Create Prediction</button>
        </form>
      )}

      {/* SEMI AUTO MODE */}
      {mode === "SEMI_AUTO" && (
        <div className="semi-box">
          <p>System running automatically...</p>
        </div>
      )}

      {/* LIST */}
      <div className="prediction-list">
        {predictions.length === 0 && <p>No predictions available</p>}

        {predictions.map((p) => (
          <div key={p._id || p.id} className="prediction-card">
            {p.type === "MANUAL" && (
              <p>
                #{p.matchNumber} — {p.homeTeam} vs {p.awayTeam}
              </p>
            )}

            {p.type === "SEMI_AUTO" && <p>{p.team} — Over 1.5 Goals</p>}

            <p>Odd: {p.odd}</p>
            <p>Stake: {p.stake}</p>

            <div className="cycles">
              {p.cycles?.map((c, i) => (
                <span key={i}>
                  {c.name}: {c.value}
                </span>
              ))}
            </div>

            <p>Status: {p.status}</p>

            {p.status === "pending" && (
              <div className="actions">
                <button onClick={() => handleResult(p._id, "won")}>WON</button>
                <button onClick={() => handleResult(p._id, "loss")}>
                  LOSS
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
