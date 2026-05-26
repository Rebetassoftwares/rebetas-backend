import { useEffect, useState } from "react";
import { getAutoPilotAnalytics } from "../../../services/adminApi";
import "./AdminAutoPilotAnalytics.css";

export default function AdminAutoPilotAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics(selectedLimit = limit) {
    try {
      setLoading(true);
      setError("");

      const res = await getAutoPilotAnalytics(selectedLimit);
      setAnalytics(res?.data || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load AutoPilot analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        const res = await getAutoPilotAnalytics(limit);
        setAnalytics(res?.data || null);
      } catch (err) {
        console.error(err);
        setError("Failed to load AutoPilot analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [limit]);

  function formatAmount(value, currency = "") {
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
    return String(value).replaceAll("_", " ");
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
            Advanced performance insights for AutoPilot accounts, Packages,
            balances and withdrawals.
          </p>
        </div>

        <button onClick={() => loadAnalytics(limit)}>Refresh</button>
      </div>

      {error && <div className="analytics-error">{error}</div>}

      <div className="analytics-filter-card">
        <div className="analytics-limit-input">
          <label>Result Limit</label>

          <input
            type="number"
            min="1"
            max="5000"
            value={limit}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (!value) {
                setLimit("");
                return;
              }

              if (value > 5000) {
                setLimit(5000);
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

        <button onClick={() => loadAnalytics(limit)}>Apply</button>
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
                {
                  label: "User",
                  render: (item) => userName(item),
                },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Capital Balance",
                  render: (item) =>
                    formatAmount(item.capitalBalance, item.currency),
                },
              ]}
            />

            <AnalyticsTable
              title="💜 Top Profit Balances"
              rows={topProfitAccounts}
              columns={[
                {
                  label: "User",
                  render: (item) => userName(item),
                },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Profit Balance",
                  render: (item) =>
                    formatAmount(item.profitBalance, item.currency),
                },
              ]}
            />

            <AnalyticsTable
              title="🏆 Top Profit Earners"
              rows={topProfitEarners}
              columns={[
                {
                  label: "User",
                  render: (item) => userName(item),
                },
                {
                  label: "Package",
                  render: (item) => item.packageNameSnapshot || "Package",
                },
                {
                  label: "Total Profit Earned",
                  render: (item) =>
                    formatAmount(item.totalProfitEarned, item.currency),
                },
              ]}
            />

            <AnalyticsTable
              title="🏦 Top Withdrawals"
              rows={topWithdrawals}
              columns={[
                {
                  label: "User",
                  render: (item) => userName(item),
                },
                {
                  label: "Type",
                  render: (item) => item.withdrawalType || "withdrawal",
                },
                {
                  label: "Amount",
                  render: (item) => formatAmount(item.amount, item.currency),
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
                      <tr key={index}>
                        <td>{item.packageName || "Package"}</td>
                        <td>{item.totalAccounts || 0}</td>
                        <td>{item.activeAccounts || 0}</td>
                        <td>
                          {formatAmount(
                            item.totalCapitalBalance,
                            item.currency,
                          )}
                        </td>
                        <td>
                          {formatAmount(item.totalProfitBalance, item.currency)}
                        </td>
                        <td>
                          {formatAmount(item.totalProfitEarned, item.currency)}
                        </td>
                        <td>
                          {formatAmount(
                            item.totalProfitWithdrawn,
                            item.currency,
                          )}
                        </td>
                        <td>
                          {formatAmount(
                            item.totalCapitalWithdrawn,
                            item.currency,
                          )}
                        </td>
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
                    <th>Currency</th>
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
                    transactionSummary.map((item, index) => (
                      <tr key={index}>
                        <td>{formatType(item._id?.type)}</td>
                        <td>{item._id?.status || "—"}</td>
                        <td>{item._id?.currency || "—"}</td>
                        <td>{item.count || 0}</td>
                        <td>
                          {formatAmount(
                            item.totalAmount,
                            item._id?.currency || "",
                          )}
                        </td>
                      </tr>
                    ))
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
