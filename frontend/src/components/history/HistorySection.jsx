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
              <td>{summary.totalBets}</td>

              <td className="result-neutral">
                {formatCurrency(summary.openingBalance)}
              </td>

              <td className="result-neutral">
                {formatCurrency(summary.closingBalance)}
              </td>

              <td className="result-neutral">
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

              <td className={summary.roi >= 0 ? "result-win" : "result-loss"}>
                {summary.roi >= 0 ? "+" : ""}
                {Number(summary.roi || 0).toFixed(2)}%
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
            ) : filteredPredictions.length > 0 ? (
              filteredPredictions.map((item) => (
                <tr key={item._id}>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{formatCycles(item.cycles)}</td>
                  <td>{item.match || "-"}</td>
                  <td>{item.odd ?? "-"}</td>

                  <td className="result-outgoing">
                    {formatCurrency(item.stake)}
                  </td>

                  <td
                    className={
                      item.resultStatus === "WIN" ? "result-win" : "result-loss"
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
