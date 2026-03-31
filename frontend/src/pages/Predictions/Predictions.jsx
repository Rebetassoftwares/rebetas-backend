import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Predictions.css";
import { getImageUrl } from "../../utils/getImageUrl";

import api from "../../services/api";

// ✅ NEW: import jerseys
import homeJersey from "../../assets/jerseys/home.png";
import awayJersey from "../../assets/jerseys/away.png";

export default function Predictions() {
  const { platform } = useParams();
  const navigate = useNavigate();

  const [leagueOptions, setLeagueOptions] = useState([]);
  const [league, setLeague] = useState("");
  const [time, setTime] = useState(new Date());
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pageError, setPageError] = useState("");

  const [timeframe, setTimeframe] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString()}`;
  };

  const selectedLeague = leagueOptions.find((item) => item._id === league);

  const platformName = selectedLeague?.platformId?.name || "";
  const platformLogo = selectedLeague?.platformId?.logo || "";

  // 🔥 NEW (CRITICAL FIX)
  const platformKey = selectedLeague?.platformId?.name?.toLowerCase();
  const leagueKey = selectedLeague?.leagueName;

  const isSemiAuto = prediction?.type === "SEMI_AUTO";
  const isManual = prediction?.type === "MANUAL";

  const [countdown, setCountdown] = useState(0);

  const [subscriptionData, setSubscriptionData] = useState({
    active: false,
    subscription: null,
  });

  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const response = await api.get("/subscriptions/status");
        setSubscriptionData(response);
      } catch (error) {
        console.error(error);
        setSubscriptionData({
          active: false,
          subscription: null,
        });
      }
    }
    loadSubscription();
  }, []);

  useEffect(() => {
    async function loadLeagues() {
      setPageError("");
      try {
        const res = await api.get(`/manual-leagues?platformId=${platform}`);

        const leagues = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        setLeagueOptions(leagues);

        if (leagues.length > 0) {
          setLeague(leagues[0]._id);
        } else {
          setLeague("");
        }
      } catch (error) {
        setPageError(error.message || "Unable to load leagues");
      }
    }

    loadLeagues();
  }, [platform]);

  // 🔥 FIXED HISTORY FETCH
  useEffect(() => {
    if (!league || !platformKey || !leagueKey) return;

    async function loadPredictionAndHistory() {
      setPageError("");
      setLoadingPrediction(true);
      setLoadingHistory(true);

      try {
        const predictionResponse = await api.get(
          `/public/predictions/live/${league}`,
        );
        setPrediction(predictionResponse || null);
      } catch (error) {
        console.error(error);
        setPrediction(null);
      } finally {
        setLoadingPrediction(false);
      }

      try {
        const historyResponse = await api.get(
          `/history/${platformKey}/${leagueKey}`,
        );

        setHistory(Array.isArray(historyResponse) ? historyResponse : []);
      } catch (error) {
        setHistory([]);
        console.error("history load error:", error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadPredictionAndHistory();
  }, [platform, league, platformKey, leagueKey, navigate]);

  // 🔥 FIXED AUTO REFRESH
  useEffect(() => {
    if (!league || !platformKey || !leagueKey) return;

    const interval = setInterval(() => {
      (async () => {
        try {
          const predictionResponse = await api.get(
            `/public/predictions/live/${league}`,
          );
          setPrediction(predictionResponse || null);

          const historyResponse = await api.get(
            `/history/${platformKey}/${leagueKey}`,
          );

          setHistory(Array.isArray(historyResponse) ? historyResponse : []);
        } catch (err) {
          console.error("Auto refresh error:", err);
        }
      })();
    }, 5000);

    return () => clearInterval(interval);
  }, [league, platformKey, leagueKey]);

  useEffect(() => {
    if (!prediction?.scheduledFor) return;

    const interval = setInterval(() => {
      const now = new Date();
      const next = new Date(prediction.scheduledFor);
      const diff = Math.max(0, next - now);
      setCountdown(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [prediction]);

  const filteredPredictions = useMemo(() => {
    let data = [...history];

    if (timeframe === "week" && selectedWeek !== "all") {
      data = data.filter((item) => String(item.week) === selectedWeek);
    }

    if (timeframe === "month" && selectedMonth !== "all") {
      data = data.filter((item) => item.month === selectedMonth);
    }

    if (timeframe === "custom" && customStartDate && customEndDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        return (
          itemDate >= new Date(customStartDate) &&
          itemDate <= new Date(customEndDate)
        );
      });
    }

    return data;
  }, [
    history,
    timeframe,
    selectedWeek,
    selectedMonth,
    customStartDate,
    customEndDate,
  ]);

  const summary = useMemo(() => {
    const totalBets = filteredPredictions.length;

    const totalReturns = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.resultAmount || 0),
      0,
    );

    const totalProfit = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.profit || 0),
      0,
    );

    // 🔥 Opening Balance
    let openingBalance = 0;

    // 🔥 Closing Balance
    let closingBalance = 0;

    if (filteredPredictions.length > 0) {
      const oldest = filteredPredictions[filteredPredictions.length - 1]; // oldest
      const latest = filteredPredictions[0]; // newest

      const oldestCapitalAfter = Number(oldest.capitalAfter || 0);
      const oldestProfit = Number(oldest.profit || 0);

      openingBalance = oldestCapitalAfter - oldestProfit;

      closingBalance = Number(latest.capitalAfter || 0);
    }

    // 🔥 ROI (Return on Investment)
    let roi = 0;
    if (openingBalance > 0) {
      roi = (totalProfit / openingBalance) * 100;
    }

    return {
      totalBets,
      openingBalance,
      closingBalance,
      totalReturns,
      totalProfit,
      roi,
    };
  }, [filteredPredictions]);

  const availableWeeks = [
    ...new Set(history.map((item) => item.week).filter(Boolean)),
  ].sort((a, b) => Number(a) - Number(b));

  const availableMonths = [
    ...new Set(history.map((item) => item.month).filter(Boolean)),
  ];

  const selectedLogo = leagueOptions.find((l) => l._id === league)?.platformId
    ?.logo;

  const homeTeam =
    prediction?.homeTeam ||
    (prediction?.match ? prediction.match.split(" vs ")[0] : "-");

  const awayTeam =
    prediction?.awayTeam ||
    (prediction?.match ? prediction.match.split(" vs ")[1] : "-");

  const isLocked = !subscriptionData.active;

  function formatCountdown(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="prediction-page">
      <DashboardNavbar />

      <div className="container prediction-container">
        <div className="platform-banner">
          {platformLogo && (
            <div className="platform-banner-bg">
              <img
                src={getImageUrl(platformLogo)}
                alt={platformName}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="platform-banner-content">
            <div className="platform-name">{platformName.toUpperCase()}</div>

            <div className="league-bar">
              {leagueOptions.map((item) => (
                <button
                  key={item._id}
                  className={
                    league === item._id ? "league-btn active" : "league-btn"
                  }
                  onClick={() => setLeague(item._id)}
                >
                  {item.leagueName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="prediction-card modern-card">
          <div className="platform-title">{platformName.toUpperCase()}</div>

          <div className="badge-row">
            {prediction?.cycles?.length > 0
              ? prediction.cycles.map((c, i) => (
                  <div key={i} className="badge">
                    {c.name}:<span>{c.value ?? "-"}</span>
                  </div>
                ))
              : null}

            <div className="badge time-badge live-time">
              {time.toLocaleTimeString()}
            </div>

            <div
              className={`badge live-badge ${prediction ? "active" : "inactive"}`}
            >
              <span className="live-dot"></span>
              {prediction ? "LIVE" : "OFF"}
            </div>
          </div>

          {loadingPrediction ? (
            <div className="prediction-loading">Loading...</div>
          ) : isSemiAuto ? (
            <div className="semi-auto-layout">
              <div className={`team-name ${isLocked ? "blurred" : ""}`}>
                {isLocked ? "🔒 TEAM" : prediction?.team || "-"}
              </div>

              <div className={`prediction-circle ${isLocked ? "locked" : ""}`}>
                {isLocked ? "🔒" : prediction?.prediction || "-"}
              </div>

              <div className="prediction-odds-row">
                <span className={isLocked ? "blurred" : ""}>
                  {isLocked ? "🔒 ODDS" : `Odds: ${prediction?.odd || "-"}`}
                </span>
              </div>

              <div className="countdown">
                Next in: {formatCountdown(countdown)}
              </div>
            </div>
          ) : (
            <div className="match-layout">
              <div className="team-block">
                <img src={homeJersey} className="jersey-img" />
                <span className={`team-name ${isLocked ? "blurred" : ""}`}>
                  {isLocked ? "🔒 HOME" : homeTeam}
                </span>
              </div>

              <div className="center-block">
                <img
                  src={getImageUrl(selectedLogo)}
                  className="center-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div
                  className={`prediction-circle ${isLocked ? "locked" : ""}`}
                >
                  {isLocked ? "🔒" : prediction?.prediction || "-"}
                </div>

                {isManual && (
                  <div className="match-number">
                    Match #{prediction?.matchNumber || "-"}
                  </div>
                )}

                <div className="prediction-odds-row">
                  <span className={isLocked ? "blurred" : ""}>
                    {isLocked ? "🔒 ODDS" : `Odds: ${prediction?.odd || "-"}`}
                  </span>
                </div>

                <div className="countdown">
                  Next in: {formatCountdown(countdown)}
                </div>
              </div>

              <div className="team-block">
                <img src={awayJersey} className="jersey-img" />
                <span className={`team-name ${isLocked ? "blurred" : ""}`}>
                  {isLocked ? "🔒 AWAY" : awayTeam}
                </span>
              </div>
            </div>
          )}

          {isLocked && !loadingPrediction && (
            <button className="unlock-btn" onClick={() => navigate("/pricing")}>
              🔓 Unlock Prediction
            </button>
          )}

          {pageError && <p style={{ color: "#ff6b6b" }}>{pageError}</p>}
        </div>

        <div className="history-section">
          <div className="history-header">
            <h2>Prediction Performance</h2>
            <span className="history-filter">
              {platformName} - {leagueKey}
            </span>
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Time Frame</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="week">By Week</option>
                <option value="month">By Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {timeframe === "week" && (
              <div className="filter-group">
                <label>Select Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                >
                  <option value="all">All Weeks</option>
                  {availableWeeks.map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeframe === "month" && (
              <div className="filter-group">
                <label>Select Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeframe === "custom" && (
              <>
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="summary-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Number of Bets</th>
                  <th>Opening Balance</th>
                  <th>Closing Balance</th>
                  <th>Total Returns</th>
                  <th>Total Profit</th>
                  <th>ROI (%)</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{summary.totalBets}</td>

                  <td className="result-neutral">
                    {formatCurrency(summary.openingBalance)}
                  </td>

                  <td className="result-neutral">
                    {formatCurrency(summary.closingBalance)}
                  </td>

                  <td
                    className={
                      summary.totalReturns >= summary.openingBalance
                        ? "result-win"
                        : "result-loss"
                    }
                  >
                    {formatCurrency(summary.totalReturns)}
                  </td>

                  <td
                    className={
                      summary.totalProfit >= 0 ? "result-win" : "result-loss"
                    }
                  >
                    {summary.totalProfit >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(summary.totalProfit))}
                  </td>

                  <td
                    className={summary.roi >= 0 ? "result-win" : "result-loss"}
                  >
                    {summary.roi >= 0 ? "+" : ""}
                    {Number(summary.roi || 0).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-scroll-box">
            <table className="past-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Week</th>
                  <th>Match</th>
                  <th>Odd</th>
                  <th>Stake</th>
                  <th>Result</th>
                  <th>Profit</th>
                </tr>
              </thead>

              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      Loading history...
                    </td>
                  </tr>
                ) : filteredPredictions.length > 0 ? (
                  filteredPredictions.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{item.week || "-"}</td>
                      <td>{item.match || "-"}</td>
                      <td>{item.odd ?? "-"}</td>

                      <td className="result-outgoing">
                        {formatCurrency(item.stake)}
                      </td>

                      <td
                        className={
                          item.resultStatus === "WIN"
                            ? "result-win"
                            : "result-loss"
                        }
                      >
                        {formatCurrency(item.resultAmount)}
                      </td>

                      <td
                        className={
                          Number(item.profit || 0) >= 0
                            ? "result-win"
                            : "result-loss"
                        }
                      >
                        {Number(item.profit || 0) >= 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(item.profit))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No prediction history found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
