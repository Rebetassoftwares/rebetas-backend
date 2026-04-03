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
  summary,
  formatCurrency,
  filteredPredictions,
  loadingHistory,
}) {
  const [startingCapital, setStartingCapital] = useState(
    Number(summary?.openingBalance || 0),
  );
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1);

  const currencyList = useMemo(() => {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.supportedValuesOf === "function"
    ) {
      return Intl.supportedValuesOf("currency");
    }

    return [
      "USD",
      "NGN",
      "GHS",
      "EUR",
      "GBP",
      "KES",
      "UGX",
      "ZAR",
      "CAD",
      "AUD",
    ];
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchRate() {
      try {
        if (selectedCurrency === "USD") {
          if (isMounted) setExchangeRate(1);
          return;
        }

        const res = await fetch(
          `https://api.frankfurter.app/latest?from=USD&to=${selectedCurrency}`,
        );
        const data = await res.json();

        if (isMounted) {
          setExchangeRate(Number(data?.rates?.[selectedCurrency] || 1));
        }
      } catch (err) {
        console.error("Currency rate fetch error:", err);
        if (isMounted) setExchangeRate(1);
      }
    }

    fetchRate();

    return () => {
      isMounted = false;
    };
  }, [selectedCurrency]);

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

  function formatDisplayCurrency(value) {
    if (selectedCurrency === "USD") {
      return formatCurrency(value);
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  const scaleFactor = useMemo(() => {
    const originalOpeningUsd = Number(summary?.openingBalance || 0);
    const rate = Number(exchangeRate || 1);

    const userOpeningUsd =
      selectedCurrency === "USD"
        ? Number(startingCapital || 0)
        : Number(startingCapital || 0) / rate;

    if (originalOpeningUsd <= 0 || userOpeningUsd <= 0) {
      return 1;
    }

    return userOpeningUsd / originalOpeningUsd;
  }, [
    summary?.openingBalance,
    startingCapital,
    exchangeRate,
    selectedCurrency,
  ]);

  const scaledSummary = useMemo(() => {
    const rate = Number(exchangeRate || 1);

    const convertUsdToSelected = (value) =>
      selectedCurrency === "USD"
        ? Number(value || 0)
        : Number(value || 0) * rate;

    return {
      totalBets: Number(summary?.totalBets || 0),
      openingBalance: convertUsdToSelected(
        Number(summary?.openingBalance || 0) * scaleFactor,
      ),
      closingBalance: convertUsdToSelected(
        Number(summary?.closingBalance || 0) * scaleFactor,
      ),
      totalReturns: convertUsdToSelected(
        Number(summary?.totalReturns || 0) * scaleFactor,
      ),
      totalProfit: convertUsdToSelected(
        Number(summary?.totalProfit || 0) * scaleFactor,
      ),
      roi: Number(summary?.roi || 0),
    };
  }, [summary, scaleFactor, exchangeRate, selectedCurrency]);

  const scaledPredictions = useMemo(() => {
    const rate = Number(exchangeRate || 1);

    const convertUsdToSelected = (value) =>
      selectedCurrency === "USD"
        ? Number(value || 0)
        : Number(value || 0) * rate;

    return filteredPredictions.map((item) => ({
      ...item,
      displayStake: convertUsdToSelected(Number(item.stake || 0) * scaleFactor),
      displayResult: convertUsdToSelected(
        Number(item.resultAmount || 0) * scaleFactor,
      ),
      displayProfit: convertUsdToSelected(
        Number(item.profit || 0) * scaleFactor,
      ),
    }));
  }, [filteredPredictions, scaleFactor, exchangeRate, selectedCurrency]);

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

        <div className="filter-group">
          <label>Set Your Capital</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={startingCapital}
            onChange={(e) => setStartingCapital(Number(e.target.value) || 0)}
          />
        </div>

        <div className="filter-group">
          <label>Currency</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            {currencyList.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY */}
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
              <td>{scaledSummary.totalBets}</td>

              <td className="result-neutral">
                {formatDisplayCurrency(scaledSummary.openingBalance)}
              </td>

              <td className="result-neutral">
                {formatDisplayCurrency(scaledSummary.closingBalance)}
              </td>

              <td className="result-neutral">
                {formatDisplayCurrency(scaledSummary.totalReturns)}
              </td>

              <td
                className={
                  scaledSummary.totalProfit >= 0 ? "result-win" : "result-loss"
                }
              >
                {scaledSummary.totalProfit >= 0 ? "+" : "-"}
                {formatDisplayCurrency(Math.abs(scaledSummary.totalProfit))}
              </td>

              <td
                className={
                  scaledSummary.roi >= 0 ? "result-win" : "result-loss"
                }
              >
                {scaledSummary.roi >= 0 ? "+" : ""}
                {Number(scaledSummary.roi || 0).toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HISTORY TABLE */}
      <div className="table-scroll-box">
        <table className="past-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Cycles</th>
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
            ) : scaledPredictions.length > 0 ? (
              scaledPredictions.map((item) => (
                <tr key={item._id}>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{formatCycles(item.cycles)}</td>
                  <td>{item.match || "-"}</td>
                  <td>{item.odd ?? "-"}</td>

                  <td className="result-outgoing">
                    {formatDisplayCurrency(item.displayStake)}
                  </td>

                  <td
                    className={
                      item.resultStatus === "WIN" ? "result-win" : "result-loss"
                    }
                  >
                    {formatDisplayCurrency(item.displayResult)}
                  </td>

                  <td
                    className={
                      Number(item.displayProfit || 0) >= 0
                        ? "result-win"
                        : "result-loss"
                    }
                  >
                    {Number(item.displayProfit || 0) >= 0 ? "+" : "-"}
                    {formatDisplayCurrency(Math.abs(item.displayProfit))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  No prediction history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
