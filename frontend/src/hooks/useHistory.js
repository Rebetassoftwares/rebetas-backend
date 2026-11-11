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

  // Used to refresh rolling time filters every minute.
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // ADMINISTRATOR-SET LEAGUE CAPITAL FROM BACKEND
  const [capitalResetAmount, setCapitalResetAmount] = useState(null);

  // REFRESH ROLLING TIME FILTERS
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
    // Sort all predictions newest first.
    let data = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    // ALL TIME
    if (timeframe === "all") {
      return data;
    }

    // LAST 1 HOUR / LAST 2 HOURS
    if (timeframe === "last_1_hour" || timeframe === "last_2_hours") {
      const now = new Date(currentTime);
      const hours = timeframe === "last_1_hour" ? 1 : 2;
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

      return data.filter((item) => {
        const itemDate = new Date(item.date);

        return (
          !Number.isNaN(itemDate.getTime()) &&
          itemDate >= cutoff &&
          itemDate <= now
        );
      });
    }

    // SINGLE DATE FILTER
    if (timeframe === "single_date" && singleDate) {
      const targetDate = new Date(`${singleDate}T00:00:00`);

      if (!Number.isNaN(targetDate.getTime())) {
        data = data.filter((item) => {
          const itemDate = new Date(item.date);

          return (
            !Number.isNaN(itemDate.getTime()) &&
            itemDate.getFullYear() === targetDate.getFullYear() &&
            itemDate.getMonth() === targetDate.getMonth() &&
            itemDate.getDate() === targetDate.getDate()
          );
        });
      }
    }

    // TODAY FILTER
    if (timeframe === "today") {
      const today = new Date(currentTime);

      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        return (
          !Number.isNaN(itemDate.getTime()) &&
          itemDate.getFullYear() === today.getFullYear() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getDate() === today.getDate()
        );
      });
    }

    // YESTERDAY FILTER
    if (timeframe === "yesterday") {
      const yesterday = new Date(currentTime);
      yesterday.setDate(yesterday.getDate() - 1);

      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        return (
          !Number.isNaN(itemDate.getTime()) &&
          itemDate.getFullYear() === yesterday.getFullYear() &&
          itemDate.getMonth() === yesterday.getMonth() &&
          itemDate.getDate() === yesterday.getDate()
        );
      });
    }

    // THIS WEEK FILTER
    if (timeframe === "this_week") {
      const now = new Date(currentTime);
      const start = new Date(now);

      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay());

      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        return !Number.isNaN(itemDate.getTime()) && itemDate >= start;
      });
    }

    // CUSTOM DATE FILTER
    if (timeframe === "custom" && customStartDate && customEndDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59.999`);

      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        start <= end
      ) {
        data = data.filter((item) => {
          const itemDate = new Date(item.date);

          return (
            !Number.isNaN(itemDate.getTime()) &&
            itemDate >= start &&
            itemDate <= end
          );
        });
      } else {
        data = [];
      }
    }

    // TIME RANGE FILTER
    const shouldApplyTimeRange =
      timeframe === "today" ||
      timeframe === "yesterday" ||
      timeframe === "single_date";

    if (shouldApplyTimeRange && timeStart && timeEnd) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        if (Number.isNaN(itemDate.getTime())) return false;

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
    currentTime,
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

    // Always use the administrator-configured league capital.
    // Do not derive opening balance from prediction records,
    // because old predictions may be automatically deleted.
    const openingBalance =
      capitalResetAmount !== null && Number.isFinite(Number(capitalResetAmount))
        ? Number(capitalResetAmount)
        : 0;

    // Closing balance reflects only profit within
    // the currently selected timeframe.
    const closingBalance = openingBalance + totalProfit;

    const roi = openingBalance > 0 ? (totalProfit / openingBalance) * 100 : 0;

    return {
      totalBets,
      openingBalance,
      closingBalance,
      totalReturns,
      totalProfit,
      roi,
    };
  }, [filteredPredictions, capitalResetAmount]);

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
