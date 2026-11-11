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
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [singleDate, setSingleDate] = useState(null);

  // CAPITAL RESET INFORMATION
  const [capitalResetAmount, setCapitalResetAmount] = useState(null);
  const [capitalResetAt, setCapitalResetAt] = useState(null);
  const [currentCapital, setCurrentCapital] = useState(null);

  // FETCH HISTORY
  useEffect(() => {
    if (!platformKey || !leagueKey) return;

    let isMounted = true;

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const res = await api.get(`/history/${platformKey}/${leagueKey}`);

        if (isMounted) {
          setHistory(Array.isArray(res?.predictions) ? res.predictions : []);

          setCapitalResetAmount(res?.capitalResetAmount ?? null);

          setCapitalResetAt(res?.capitalResetAt ?? null);

          setCurrentCapital(res?.currentCapital ?? null);
        }
      } catch (err) {
        console.error("History load error:", err);

        if (isMounted) {
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [platformKey, leagueKey]);

  // AUTO REFRESH
  useEffect(() => {
    if (!platformKey || !leagueKey) return;

    let isMounted = true;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/history/${platformKey}/${leagueKey}`);

        if (isMounted) {
          setHistory(Array.isArray(res?.predictions) ? res.predictions : []);

          setCapitalResetAmount(res?.capitalResetAmount ?? null);

          setCapitalResetAt(res?.capitalResetAt ?? null);

          setCurrentCapital(res?.currentCapital ?? null);
        }
      } catch (err) {
        console.error("History auto refresh error:", err);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [platformKey, leagueKey]);

  // FIXED STAKE REFERENCE CAPITAL
  // This is calculated from the complete history, not the selected timeframe.
  // Therefore, Today, Yesterday, and All Time share the same reference capital.
  const stakeReferenceCapital = useMemo(() => {
    if (capitalResetAmount !== null) {
      return Number(capitalResetAmount);
    }

    if (history.length > 0) {
      const oldestPrediction = [...history].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      )[0];

      const openingCapital =
        Number(oldestPrediction.capitalAfter || 0) -
        Number(oldestPrediction.profit || 0);

      return Number.isFinite(openingCapital) ? openingCapital : 0;
    }

    return currentCapital !== null ? Number(currentCapital) : 0;
  }, [history, capitalResetAmount, currentCapital]);

  // FILTERING + SORTING
  const filteredPredictions = useMemo(() => {
    let data = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    // SINGLE DATE FILTER
    if (singleDate) {
      const targetDate = new Date(singleDate).toDateString();

      data = data.filter(
        (item) => new Date(item.date).toDateString() === targetDate,
      );
    }

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

    // TIME RANGE FILTER
    const shouldApplyTimeRange =
      timeframe === "today" || timeframe === "yesterday" || Boolean(singleDate);

    if (shouldApplyTimeRange && timeStart && timeEnd) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        const itemMinutes = itemDate.getHours() * 60 + itemDate.getMinutes();

        const [startH, startM] = timeStart.split(":").map(Number);

        const [endH, endM] = timeEnd.split(":").map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // NORMAL RANGE
        if (startMinutes <= endMinutes) {
          return itemMinutes >= startMinutes && itemMinutes <= endMinutes;
        }

        // OVERNIGHT RANGE
        return itemMinutes >= startMinutes || itemMinutes <= endMinutes;
      });
    }

    return data;
  }, [
    history,
    timeframe,
    customStartDate,
    customEndDate,
    timeStart,
    timeEnd,
    singleDate,
  ]);

  // SUMMARY
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

    const hasReset = capitalResetAmount !== null;
    const resetDate = capitalResetAt ? new Date(capitalResetAt) : null;

    if (filteredPredictions.length > 0) {
      const oldest = filteredPredictions[filteredPredictions.length - 1];

      const latest = filteredPredictions[0];

      const oldestDate = new Date(oldest.date);

      const balanceBeforeOldest =
        Number(oldest.capitalAfter || 0) - Number(oldest.profit || 0);

      // ALL TIME: the latest capital reset starts
      // the new performance accounting period.
      if (timeframe === "all" && hasReset) {
        openingBalance = Number(capitalResetAmount);
      } else if (hasReset && resetDate && oldestDate < resetDate) {
        // The selected history begins before the latest reset.
        openingBalance = Number(capitalResetAmount);
      } else {
        // Preserve the existing period-opening calculation.
        openingBalance = balanceBeforeOldest;
      }

      closingBalance = Number(latest.capitalAfter || 0);
    } else if (hasReset) {
      // No predictions in the selected period.
      openingBalance = Number(capitalResetAmount);

      closingBalance =
        currentCapital !== null
          ? Number(currentCapital)
          : Number(capitalResetAmount);
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

      // Same reference capital for every timeframe.
      stakeReferenceCapital,
    };
  }, [
    filteredPredictions,
    capitalResetAmount,
    capitalResetAt,
    currentCapital,
    timeframe,
    stakeReferenceCapital,
  ]);

  // AVAILABLE FILTER OPTIONS
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
    timeStart,
    timeEnd,
    setTimeStart,
    setTimeEnd,
    singleDate,
    setSingleDate,
  };
}
