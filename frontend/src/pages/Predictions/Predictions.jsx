import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Predictions.css";

import SemiAutoView from "../../components/prediction/SemiAutoView";
import PredictionBadges from "../../components/prediction/PredictionBadges";
import ManualView from "../../components/prediction/ManualView";
import PlatformBanner from "../../components/prediction/PlatformBanner";
import HistorySection from "../../components/history/HistorySection";

import api from "../../services/api";
import usePrediction from "../../hooks/usePrediction";
import useHistory from "../../hooks/useHistory";

export default function Predictions() {
  const { platform } = useParams();
  const navigate = useNavigate();

  const [leagueOptions, setLeagueOptions] = useState([]);
  const [league, setLeague] = useState("");
  const [time, setTime] = useState(new Date());
  const [pageError, setPageError] = useState("");

  const [timeframe, setTimeframe] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [subscriptionData, setSubscriptionData] = useState({
    active: false,
    subscription: null,
  });

  const { prediction, loadingPrediction, countdown } = usePrediction(league);

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString()}`;
  };

  const selectedLeague = useMemo(
    () => leagueOptions.find((item) => item._id === league),
    [leagueOptions, league],
  );

  const platformName = selectedLeague?.platformId?.name || "";
  const platformLogo = selectedLeague?.platformId?.logo || "";
  const platformKey = selectedLeague?.platformId?.name?.toLowerCase() || "";
  const leagueKey = selectedLeague?.leagueName || "";

  const {
    loadingHistory,
    filteredPredictions,
    summary,
    availableWeeks,
    availableMonths,
  } = useHistory({
    platformKey,
    leagueKey,
    timeframe,
    selectedWeek,
    selectedMonth,
    customStartDate,
    customEndDate,
  });

  const isSemiAuto = prediction?.type === "SEMI_AUTO";
  const isManual = prediction?.type === "MANUAL";
  const isLocked = !subscriptionData.active;

  const selectedLogo = selectedLeague?.platformId?.logo;

  const homeTeam =
    prediction?.homeTeam ||
    (prediction?.match ? prediction.match.split(" vs ")[0] : "-");

  const awayTeam =
    prediction?.awayTeam ||
    (prediction?.match ? prediction.match.split(" vs ")[1] : "-");

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

        const leagues = Array.isArray(res) ? res : [];

        setLeagueOptions(leagues);

        if (leagues.length > 0) {
          setLeague(leagues[0]._id);
        } else {
          setLeague("");
        }
      } catch (error) {
        console.error(error);
        setPageError(error.message || "Unable to load leagues");
      }
    }

    loadLeagues();
  }, [platform]);

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
        <PlatformBanner
          platformName={platformName}
          platformLogo={platformLogo}
          leagueOptions={leagueOptions}
          league={league}
          setLeague={setLeague}
        />

        <div className="prediction-card modern-card">
          <div className="platform-title">{platformName.toUpperCase()}</div>

          <PredictionBadges prediction={prediction} time={time} />

          {loadingPrediction ? (
            <div className="prediction-loading">Loading...</div>
          ) : isSemiAuto ? (
            <SemiAutoView
              prediction={prediction}
              isLocked={isLocked}
              countdown={countdown}
              formatCountdown={formatCountdown}
            />
          ) : (
            <ManualView
              prediction={prediction}
              isLocked={isLocked}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              selectedLogo={selectedLogo}
              countdown={countdown}
              formatCountdown={formatCountdown}
              isManual={isManual}
            />
          )}

          {isLocked && !loadingPrediction && (
            <button className="unlock-btn" onClick={() => navigate("/pricing")}>
              🔓 Unlock Prediction
            </button>
          )}

          {pageError && <p style={{ color: "#ff6b6b" }}>{pageError}</p>}
        </div>

        <HistorySection
          platformName={platformName}
          leagueKey={leagueKey}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          availableWeeks={availableWeeks}
          availableMonths={availableMonths}
          summary={summary}
          formatCurrency={formatCurrency}
          filteredPredictions={filteredPredictions}
          loadingHistory={loadingHistory}
        />
      </div>

      <Footer />
    </div>
  );
}
