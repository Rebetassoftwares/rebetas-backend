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

  // ORIGINAL CAPITAL RESET AMOUNT
  const [capitalResetAmount, setCapitalResetAmount] = useState(null);

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
    // These totals belong only to the selected timeframe.
    const totalBets = filteredPredictions.length;

    const totalReturns = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.resultAmount || 0),
      0,
    );

    const totalProfit = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.profit || 0),
      0,
    );

    // FIND THE ORIGINAL OPENING CAPITAL.
    // This calculation uses the COMPLETE history, not filtered history.
    let originalOpeningBalance = 0;

    if (capitalResetAmount !== null) {
      originalOpeningBalance = Number(capitalResetAmount);
    } else if (history.length > 0) {
      const oldestPrediction = [...history].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      )[0];

      originalOpeningBalance =
        Number(oldestPrediction.capitalAfter || 0) -
        Number(oldestPrediction.profit || 0);
    }

    // OPENING BALANCE NEVER CHANGES WITH THE SELECTED TIMEFRAME.
    const openingBalance = originalOpeningBalance;

    // CLOSING BALANCE IS CALCULATED INDEPENDENTLY.
    // It never replaces or modifies the original opening balance.
    const closingBalance = openingBalance + totalProfit;

    // ROI USES THE ORIGINAL OPENING CAPITAL.
    const roi = openingBalance > 0 ? (totalProfit / openingBalance) * 100 : 0;

    return {
      totalBets,
      openingBalance,
      closingBalance,
      totalReturns,
      totalProfit,
      roi,
    };
  }, [filteredPredictions, history, capitalResetAmount]);

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
