import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function useHistory({
  platformKey,
  leagueKey,
  timeframe,
  selectedWeek,
  selectedMonth,
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

  // 🔥 FILTERING
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

  // 🔥 SUMMARY
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

      const oldestCapitalAfter = Number(oldest.capitalAfter || 0);
      const oldestProfit = Number(oldest.profit || 0);

      openingBalance = oldestCapitalAfter - oldestProfit;
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
