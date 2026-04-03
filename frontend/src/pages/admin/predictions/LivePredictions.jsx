import { useEffect, useState, useCallback, useMemo } from "react";
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

  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");

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

  const platformNames = useMemo(() => Object.keys(grouped), [grouped]);

  const leaguesForSelectedPlatform = useMemo(() => {
    if (!selectedPlatform || !grouped[selectedPlatform]) return [];
    return Object.entries(grouped[selectedPlatform]);
  }, [grouped, selectedPlatform]);

  const selectedPredictions = useMemo(() => {
    if (!selectedPlatform || !selectedLeague) return [];
    return grouped[selectedPlatform]?.[selectedLeague] || [];
  }, [grouped, selectedPlatform, selectedLeague]);

  useEffect(() => {
    if (!platformNames.length) {
      setSelectedPlatform("");
      setSelectedLeague("");
      return;
    }

    setSelectedPlatform((prev) => {
      if (prev && grouped[prev]) return prev;
      return platformNames[0];
    });
  }, [platformNames, grouped]);

  useEffect(() => {
    if (!selectedPlatform || !grouped[selectedPlatform]) {
      setSelectedLeague("");
      return;
    }

    const leagueNames = Object.keys(grouped[selectedPlatform]);

    setSelectedLeague((prev) => {
      if (prev && grouped[selectedPlatform]?.[prev]) return prev;
      return leagueNames[0] || "";
    });
  }, [grouped, selectedPlatform]);

  // RESULT UPDATE
  const handleResult = useCallback(
    async (id, status) => {
      if (updatingIds.has(id)) return;

      let previousGrouped = null;

      try {
        setError("");

        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });

        setGrouped((prev) => {
          previousGrouped = prev;

          const updated = {};

          Object.entries(prev).forEach(([platform, leagues]) => {
            updated[platform] = {};

            Object.entries(leagues).forEach(([league, predictions]) => {
              updated[platform][league] = predictions.map((p) =>
                (p._id || p.id) === id ? { ...p, status } : p,
              );
            });
          });

          return updated;
        });

        await updatePredictionResult(id, { status });
      } catch (err) {
        console.error(err);
        setError("Update failed");

        if (previousGrouped) {
          setGrouped(previousGrouped);
        }
      } finally {
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

      {platformNames.length === 0 && <p>No active predictions</p>}

      {platformNames.length > 0 && (
        <>
          <div className="platform-filter-wrap">
            <div className="platform-filter-header">
              {selectedPlatform && platformMap[selectedPlatform]?.logo && (
                <img
                  src={getImageUrl(platformMap[selectedPlatform].logo)}
                  alt={selectedPlatform}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <h3>{selectedPlatform || "Platforms"}</h3>
            </div>

            <div className="platform-filter-tabs">
              {platformNames.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className={
                    selectedPlatform === platform
                      ? "platform-filter-tab active"
                      : "platform-filter-tab"
                  }
                  onClick={() => {
                    setSelectedPlatform(platform);
                    const nextLeague =
                      Object.keys(grouped[platform] || {})[0] || "";
                    setSelectedLeague(nextLeague);
                  }}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {!!selectedPlatform && leaguesForSelectedPlatform.length > 0 && (
            <div className="league-filter-wrap">
              <div className="league-filter-tabs">
                {leaguesForSelectedPlatform.map(([league, preds]) => {
                  const pendingCount = preds.filter(
                    (p) => p.status === "pending",
                  ).length;

                  return (
                    <button
                      key={league}
                      type="button"
                      className={
                        selectedLeague === league
                          ? "league-filter-tab active"
                          : "league-filter-tab"
                      }
                      onClick={() => setSelectedLeague(league)}
                    >
                      <span className="league-filter-name">{league}</span>
                      <span className="league-filter-count">
                        {pendingCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!!selectedPlatform && !!selectedLeague && (
            <div className="platform-block">
              <div className="platform-header">
                {platformMap[selectedPlatform]?.logo && (
                  <img
                    src={getImageUrl(platformMap[selectedPlatform].logo)}
                    alt={selectedPlatform}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <h3>{selectedPlatform}</h3>
              </div>

              <div className="league-block">
                <div className="league-title-row">
                  <h4>{selectedLeague}</h4>
                  <span className="league-pending-badge">
                    Pending:{" "}
                    {
                      selectedPredictions.filter((p) => p.status === "pending")
                        .length
                    }
                  </span>
                </div>

                <div className="prediction-grid">
                  {selectedPredictions.length === 0 && <p>No predictions</p>}

                  {selectedPredictions.map((p) => (
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
                          <button
                            type="button"
                            disabled={updatingIds.has(p._id)}
                            onClick={() => handleResult(p._id, "won")}
                          >
                            {updatingIds.has(p._id) ? "Updating..." : "WON"}
                          </button>

                          <button
                            type="button"
                            disabled={updatingIds.has(p._id)}
                            onClick={() => handleResult(p._id, "loss")}
                          >
                            {updatingIds.has(p._id) ? "Updating..." : "LOSS"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
