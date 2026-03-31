export default function HistorySection({
  platformName,
  leagueKey,
  timeframe,
  setTimeframe,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  availableWeeks,
  availableMonths,
  summary,
  formatCurrency,
  filteredPredictions,
  loadingHistory,
}) {
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
            <option value="week">By Week</option>
            <option value="month">By Month</option>
            <option value="custom">Custom Date</option>
          </select>
        </div>

        {timeframe === "week" && (
          <div className="filter-group">
            <label>Select Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="all">All Weeks</option>
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
        )}

        {timeframe === "month" && (
          <div className="filter-group">
            <label>Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
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

              <td
                className={
                  summary.totalReturns >= summary.openingBalance
                    ? "result-win"
                    : "result-loss"
                }
              >
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
              <th>Date</th>
              <th>Week</th>
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
                  <td>
                    {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                  </td>
                  <td>{item.week || "-"}</td>
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
                  No prediction history found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
