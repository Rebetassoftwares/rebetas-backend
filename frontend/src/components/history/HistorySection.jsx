import { useCallback, useEffect, useMemo, useState } from "react";

export default function HistorySection({
  platformName,
  leagueKey,
  platformActivityCount,
  leagueActivityCount,
  timeframe,
  setTimeframe,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  singleDate,
  setSingleDate,
  setTimeStart,
  setTimeEnd,
  summary,
  formatCurrency,
  filteredPredictions,
  loadingHistory,
}) {
  // Store custom capital in USD as the base currency.
  const [startingCapital, setStartingCapital] = useState(null);

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

  // FETCH CURRENCY RATE
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

        if (isMounted) {
          setExchangeRate(1);
        }
      }
    }

    fetchRate();

    return () => {
      isMounted = false;
    };
  }, [selectedCurrency]);

  // CURRENCY CONVERSION
  const convertUsdToSelected = useCallback(
    (value) => {
      const amount = Number(value || 0);

      return selectedCurrency === "USD"
        ? amount
        : amount * Number(exchangeRate || 1);
    },
    [exchangeRate, selectedCurrency],
  );

  // ORIGINAL OPENING CAPITAL
  const originalOpeningCapital = Number(summary?.openingBalance || 0);

  // DISPLAY THE CAPITAL ENTERED BY THE USER,
  // OR THE ORIGINAL OPENING CAPITAL IF NO CUSTOM CAPITAL EXISTS.
  const openingBalanceUsd =
    startingCapital !== null ? startingCapital : originalOpeningCapital;

  // CAPITAL INPUT DISPLAY
  const capitalInputValue =
    selectedCurrency === "USD"
      ? openingBalanceUsd
      : openingBalanceUsd * Number(exchangeRate || 1);

  // FORMAT CURRENCY
  function formatDisplayCurrency(value) {
    if (selectedCurrency === "USD") {
      return formatCurrency(Number(value || 0));
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  // FORMAT CYCLES
  function formatCycles(cycles) {
    if (!Array.isArray(cycles) || cycles.length === 0) {
      return "-";
    }

    return cycles.map((cycle) => `${cycle.name}: ${cycle.value}`).join(" | ");
  }

  // FORMAT DATE
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

  // SUMMARY
  // No capital scaling. Only currency conversion is applied.
  const displayedSummary = useMemo(() => {
    const totalProfitUsd = Number(summary?.totalProfit || 0);
    const totalReturnsUsd = Number(summary?.totalReturns || 0);

    const displayedOpeningBalance = convertUsdToSelected(openingBalanceUsd);

    const displayedProfit = convertUsdToSelected(totalProfitUsd);

    // Closing balance is calculated independently for the selected period.
    // It never replaces or changes the opening balance.
    const closingBalance = displayedOpeningBalance + displayedProfit;

    const roi =
      openingBalanceUsd > 0 ? (totalProfitUsd / openingBalanceUsd) * 100 : 0;

    return {
      totalBets: Number(summary?.totalBets || 0),
      openingBalance: displayedOpeningBalance,
      closingBalance,
      totalReturns: convertUsdToSelected(totalReturnsUsd),
      totalProfit: displayedProfit,
      roi,
    };
  }, [summary, openingBalanceUsd, convertUsdToSelected]);

  // PREDICTIONS
  // Display actual recorded stake, result and profit.
  // No scaling is performed.
  const displayedPredictions = useMemo(() => {
    return (Array.isArray(filteredPredictions) ? filteredPredictions : []).map(
      (item) => ({
        ...item,
        displayStake: convertUsdToSelected(item.stake),
        displayResult: convertUsdToSelected(item.resultAmount),
        displayProfit: convertUsdToSelected(item.profit),
      }),
    );
  }, [filteredPredictions, convertUsdToSelected]);

  return (
    <div className="history-section">
      {/* HEADER */}
      <div className="history-header">
        <h2>Prediction Performance</h2>

        <div className="history-filter">
          <span>{platformName}</span>

          {platformActivityCount != null && (
            <span className="history-activity-badge">
              <span aria-hidden="true">👤</span>
              {Number(platformActivityCount).toLocaleString()}
            </span>
          )}

          <span>-</span>

          <span>{leagueKey}</span>

          {leagueActivityCount != null && (
            <span className="history-activity-badge">
              <span aria-hidden="true">👤</span>
              {Number(leagueActivityCount).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Time Frame</label>

          <select
            value={timeframe}
            onChange={(e) => {
              const value = e.target.value;

              setTimeframe(value);

              if (value !== "single_date") {
                setSingleDate(null);
              }

              // Clear time restrictions when switching to a timeframe
              // that does not support time-of-day filtering.
              if (!["today", "yesterday", "single_date"].includes(value)) {
                setTimeStart(null);
                setTimeEnd(null);
              }
            }}
          >
            <option value="all">All Time</option>
            <option value="last_1_hour">Last 1 Hour</option>
            <option value="last_2_hours">Last 2 Hours</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
          </select>
        </div>

        {timeframe === "single_date" && (
          <div className="filter-group">
            <label>Select Date</label>

            <input
              type="date"
              value={singleDate || ""}
              onChange={(e) => setSingleDate(e.target.value)}
            />
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

        <div className="filter-group">
          <label>Set Your Capital</label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={capitalInputValue}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                setStartingCapital(null);
                return;
              }

              const enteredAmount = Number(value);

              // Convert the entered currency amount back to USD
              // so the same capital is preserved when currency changes.
              setStartingCapital(
                selectedCurrency === "USD"
                  ? enteredAmount
                  : enteredAmount / Number(exchangeRate || 1),
              );
            }}
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
              <td>{displayedSummary.totalBets}</td>

              <td className="result-neutral">
                {formatDisplayCurrency(displayedSummary.openingBalance)}
              </td>

              <td className="result-neutral">
                {formatDisplayCurrency(displayedSummary.closingBalance)}
              </td>

              <td className="result-neutral">
                {formatDisplayCurrency(displayedSummary.totalReturns)}
              </td>

              <td
                className={
                  displayedSummary.totalProfit >= 0
                    ? "result-win"
                    : "result-loss"
                }
              >
                {displayedSummary.totalProfit >= 0 ? "+" : "-"}
                {formatDisplayCurrency(Math.abs(displayedSummary.totalProfit))}
              </td>

              <td
                className={
                  displayedSummary.roi >= 0 ? "result-win" : "result-loss"
                }
              >
                {displayedSummary.roi >= 0 ? "+" : ""}
                {Number(displayedSummary.roi || 0).toFixed(2)}%
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
            ) : displayedPredictions.length > 0 ? (
              displayedPredictions.map((item) => (
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
