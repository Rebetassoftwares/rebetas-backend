import { useEffect, useState } from "react";
import { getAutoPilotAnalytics } from "../../../services/adminApi";
import "./AdminAutoPilotAnalytics.css";

const BASE_CURRENCY = "USD";

export default function AdminAutoPilotAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics(selectedLimit = limit) {
    try {
      setLoading(true);
      setError("");

      const safeLimit = Math.min(Math.max(Number(selectedLimit) || 10, 1), 50);
      const res = await getAutoPilotAnalytics(safeLimit);

      setAnalytics(res?.data || null);
    } catch (err) {
      console.error("Load AutoPilot analytics error:", err);
      setError(err.message || "Failed to load AutoPilot analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const baseCurrency = analytics?.baseCurrency || BASE_CURRENCY;

  function formatAmount(value, currency = baseCurrency) {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  function userName(item) {
    return (
      item?.user?.fullName ||
      item?.user?.username ||
      item?.user?.email ||
      "Unknown User"
    );
  }

  function formatType(value = "") {
    return String(value || "—").replaceAll("_", " ");
  }

  const topCapitalAccounts = analytics?.topCapitalAccounts || [];
  const topProfitAccounts = analytics?.topProfitAccounts || [];
  const topProfitEarners = analytics?.topProfitEarners || [];
  const topWithdrawals = analytics?.topWithdrawals || [];
  const packagePerformance = analytics?.packagePerformance || [];
  const transactionSummary = analytics?.transactionSummary || [];

  return (
    <div className="autopilot-analytics-page">
      <div className="analytics-header">
        <div>
          <h2>📈 AutoPilot Analytics</h2>
          <p>
            Advanced USD performance insights for AutoPilot accounts, Packages,
            balances and withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAnalytics(limit)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="analytics-error">{error}</div>}

      <div className="analytics-filter-card">
        <div className="analytics-limit-input">
          <label>Result Limit</label>

          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (!value) {
                setLimit("");
                return;
              }

              if (value > 50) {
                setLimit(50);
                return;
              }

              if (value < 1) {
                setLimit(1);
                return;
              }

              setLimit(value);
            }}
            placeholder="Enter limit"
          />
        </div>

        <button
          type="button"
          onClick={() => loadAnalytics(limit)}
          disabled={loading}
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="analytics-loading">Loading AutoPilot analytics...</div>
      ) : (
        <>
          <div className="analytics-grid">
            <AnalyticsTable
              title="💰 Top Capital Accounts"
              rows={topCapitalAccounts}
              columns={[
                { label: "User", render: (item) => userName(item) },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Capital Balance",
                  render: (item) => formatAmount(item.baseCapitalBalance),
                },
              ]}
            />

            <AnalyticsTable
              title="💜 Top Profit Balances"
              rows={topProfitAccounts}
              columns={[
                { label: "User", render: (item) => userName(item) },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Profit Balance",
                  render: (item) => formatAmount(item.baseProfitBalance),
                },
              ]}
            />

            <AnalyticsTable
              title="🏆 Top Profit Earners"
              rows={topProfitEarners}
              columns={[
                { label: "User", render: (item) => userName(item) },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Total Profit Earned",
                  render: (item) => formatAmount(item.baseTotalProfitEarned),
                },
              ]}
            />

            <AnalyticsTable
              title="🏦 Top Withdrawals"
              rows={topWithdrawals}
              columns={[
                { label: "User", render: (item) => userName(item) },
                {
                  label: "Type",
                  render: (item) => item.withdrawalType || "withdrawal",
                },
                {
                  label: "Amount",
                  render: (item) =>
                    formatAmount(
                      item.baseAmount,
                      item.baseCurrency || baseCurrency,
                    ),
                },
              ]}
            />
          </div>

          <div className="analytics-section">
            <h3>📦 Package Performance</h3>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Accounts</th>
                    <th>Active</th>
                    <th>Capital Balance</th>
                    <th>Profit Balance</th>
                    <th>Profit Earned</th>
                    <th>Profit Withdrawn</th>
                    <th>Capital Withdrawn</th>
                  </tr>
                </thead>

                <tbody>
                  {packagePerformance.length === 0 ? (
                    <tr>
                      <td colSpan="8">No package performance data.</td>
                    </tr>
                  ) : (
                    packagePerformance.map((item, index) => (
                      <tr key={item.packageId || index}>
                        <td>{item.packageName || "Package"}</td>
                        <td>{item.totalAccounts || 0}</td>
                        <td>{item.activeAccounts || 0}</td>
                        <td>{formatAmount(item.totalBaseCapitalBalance)}</td>
                        <td>{formatAmount(item.totalBaseProfitBalance)}</td>
                        <td>{formatAmount(item.totalBaseProfitEarned)}</td>
                        <td>{formatAmount(item.totalBaseProfitWithdrawn)}</td>
                        <td>{formatAmount(item.totalBaseCapitalWithdrawn)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-section">
            <h3>🧾 Transaction Summary</h3>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Base Currency</th>
                    <th>Count</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {transactionSummary.length === 0 ? (
                    <tr>
                      <td colSpan="5">No transaction summary data.</td>
                    </tr>
                  ) : (
                    transactionSummary.map((item, index) => {
                      const currency = item._id?.baseCurrency || baseCurrency;

                      return (
                        <tr key={index}>
                          <td>{formatType(item._id?.type)}</td>
                          <td>{item._id?.status || "—"}</td>
                          <td>{currency}</td>
                          <td>{item.count || 0}</td>
                          <td>{formatAmount(item.totalAmount, currency)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsTable({ title, rows, columns }) {
  return (
    <div className="analytics-mini-table-card">
      <h3>{title}</h3>

      <div className="analytics-mini-table-wrapper">
        <table className="analytics-mini-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>No data available.</td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr key={item._id || index}>
                  {columns.map((column) => (
                    <td key={column.label}>{column.render(item)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
