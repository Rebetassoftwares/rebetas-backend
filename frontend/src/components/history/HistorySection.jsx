import { useEffect, useMemo, useState } from "react";

export default function HistorySection({
  platformName,
  leagueKey,
  timeframe,
  setTimeframe,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  //summary,
  //formatCurrency,
  filteredPredictions,
  loadingHistory,
}) {
  // 🔥 NEW: simulation + currency
  const [simAmount, setSimAmount] = useState(100);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [rate, setRate] = useState(1);

  // 🔥 FULL currency list (not limited)
  const currencyList = useMemo(() => {
    return Intl.supportedValuesOf
      ? Intl.supportedValuesOf("currency")
      : ["USD", "NGN", "GHS", "EUR"]; // fallback
  }, []);

  // 🔥 fetch exchange rate
  useEffect(() => {
    async function fetchRate() {
      try {
        if (selectedCurrency === "USD") {
          setRate(1);
          return;
        }

        const res = await fetch(
          `https://api.frankfurter.app/latest?from=USD&to=${selectedCurrency}`,
        );
        const data = await res.json();

        setRate(Number(data?.rates?.[selectedCurrency] || 1));
      } catch (err) {
        console.error("Rate error:", err);
        setRate(1);
      }
    }

    fetchRate();
  }, [selectedCurrency]);

  // 🔥 convert helper
  function convert(value) {
    return Number(value || 0) * rate;
  }

  function formatDisplay(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
    }).format(value);
  }

  function formatCycles(cycles) {
    if (!Array.isArray(cycles) || cycles.length === 0) return "-";

    return cycles.map((cycle) => `${cycle.name}: ${cycle.value}`).join(" | ");
  }

  function formatDateTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 🔥 SIMULATED DATA
  const simulated = useMemo(() => {
    const rows = filteredPredictions.map((item) => {
      const odd = Number(item.odd || 0);
      const stake = simAmount;

      let resultAmount = 0;
      let profit = 0;

      if (item.resultStatus === "WIN") {
        resultAmount = stake * odd;
        profit = resultAmount - stake;
      } else {
        profit = -stake;
      }

      return {
        ...item,
        simStake: stake,
        simResult: resultAmount,
        simProfit: profit,
      };
    });

    // ✅ NO mutation — use reduce
    const totals = rows.reduce(
      (acc, item) => {
        acc.totalReturns += item.simResult;
        acc.totalProfit += item.simProfit;
        return acc;
      },
      { totalReturns: 0, totalProfit: 0 },
    );

    const opening = simAmount;
    const closing = opening + totals.totalProfit;
    const roi = opening > 0 ? (totals.totalProfit / opening) * 100 : 0;

    return {
      rows,
      summary: {
        totalBets: rows.length,
        opening,
        closing,
        totalReturns: totals.totalReturns,
        totalProfit: totals.totalProfit,
        roi,
      },
    };
  }, [filteredPredictions, simAmount]);

  return (
    <div className="history-section">
      {/* HEADER */}
      <div className="history-header">
        <h2>Prediction Performance</h2>
        <span className="history-filter">
          {platformName} - {leagueKey}
        </span>
      </div>

      {/* FILTERS */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Time Frame</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="custom">Custom Date</option>
          </select>
        </div>

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

        {/* 🔥 NEW CONTROLS */}
        <div className="filter-group">
          <label>Amount</label>
          <input
            type="number"
            value={simAmount}
            onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
          />
        </div>

        <div className="filter-group">
          <label>Currency</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            {currencyList.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="summary-table-wrapper">
        <table className="summary-table">
          <tbody>
            <tr>
              <td>{simulated.summary.totalBets}</td>
              <td>{formatDisplay(convert(simulated.summary.opening))}</td>
              <td>{formatDisplay(convert(simulated.summary.closing))}</td>
              <td>{formatDisplay(convert(simulated.summary.totalReturns))}</td>

              <td
                className={
                  simulated.summary.totalProfit >= 0
                    ? "result-win"
                    : "result-loss"
                }
              >
                {simulated.summary.totalProfit >= 0 ? "+" : "-"}
                {formatDisplay(
                  convert(Math.abs(simulated.summary.totalProfit)),
                )}
              </td>

              <td>
                {simulated.summary.roi >= 0 ? "+" : ""}
                {simulated.summary.roi.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HISTORY TABLE */}
      <div className="table-scroll-box">
        <table className="past-table">
          <tbody>
            {loadingHistory ? (
              <tr>
                <td colSpan="7">Loading history...</td>
              </tr>
            ) : simulated.rows.length > 0 ? (
              simulated.rows.map((item) => (
                <tr key={item._id}>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{formatCycles(item.cycles)}</td>
                  <td>{item.match || "-"}</td>
                  <td>{item.odd ?? "-"}</td>

                  <td>{formatDisplay(convert(item.simStake))}</td>

                  <td
                    className={
                      item.resultStatus === "WIN" ? "result-win" : "result-loss"
                    }
                  >
                    {formatDisplay(convert(item.simResult))}
                  </td>

                  <td
                    className={
                      item.simProfit >= 0 ? "result-win" : "result-loss"
                    }
                  >
                    {item.simProfit >= 0 ? "+" : "-"}
                    {formatDisplay(convert(Math.abs(item.simProfit)))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No prediction history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
