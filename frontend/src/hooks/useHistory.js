import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function useHistory({
  platformKey,
  leagueKey,
  timeframe,
  customStartDate,
  customEndDate,
}) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 🔥 FETCH HISTORY
  useEffect(() => {
    if (!platformKey || !leagueKey) return;

    let isMounted = true;

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const res = await api.get(`/history/${platformKey}/${leagueKey}`);

        if (isMounted) {
          setHistory(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error("History load error:", err);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [platformKey, leagueKey]);

  // 🔥 AUTO REFRESH
  useEffect(() => {
    if (!platformKey || !leagueKey) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/history/${platformKey}/${leagueKey}`);
        setHistory(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("History auto refresh error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [platformKey, leagueKey]);

  // 🔥 FILTERING + SORTING (FIXED)
  const filteredPredictions = useMemo(() => {
    let data = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)); // ✅ CRITICAL FIX

    if (timeframe === "today") {
      const today = new Date().toDateString();
      data = data.filter(
        (item) => new Date(item.date).toDateString() === today,
      );
    }

    if (timeframe === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      data = data.filter(
        (item) =>
          new Date(item.date).toDateString() === yesterday.toDateString(),
      );
    }

    if (timeframe === "this_week") {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - now.getDay()));

      data = data.filter((item) => new Date(item.date) >= start);
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
  }, [history, timeframe, customStartDate, customEndDate]);

  // 🔥 SUMMARY (USING BACKEND CAPITAL CORRECTLY)
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

    let openingBalance = 0;
    let closingBalance = 0;

    if (filteredPredictions.length > 0) {
      const oldest = filteredPredictions[filteredPredictions.length - 1];
      const latest = filteredPredictions[0];

      // ✅ SAFE CAPITAL USAGE
      openingBalance =
        Number(oldest.capitalAfter || 0) - Number(oldest.profit || 0);

      closingBalance = Number(latest.capitalAfter || 0);
    }

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

  // 🔥 AVAILABLE FILTER OPTIONS
  const availableWeeks = [
    ...new Set(history.map((item) => item.week).filter(Boolean)),
  ].sort((a, b) => Number(a) - Number(b));

  const availableMonths = [
    ...new Set(history.map((item) => item.month).filter(Boolean)),
  ];

  return {
    history,
    loadingHistory,
    filteredPredictions,
    summary,
    availableWeeks,
    availableMonths,
  };
}
