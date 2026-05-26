import { useEffect, useState } from "react";
import { getAutoPilotDashboard } from "../../../services/adminApi";
import "./AdminAutoPilotDashboard.css";

export default function AdminAutoPilotDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await getAutoPilotDashboard();

      setDashboard(res?.data || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load AutoPilot Dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const overview = dashboard?.overview || {};
  const packageBreakdown = dashboard?.packageBreakdown || [];
  const byCurrency = dashboard?.byCurrency || [];
  const transactionTypes = dashboard?.transactionTypes || [];

  function formatAmount(value) {
    return Number(value || 0).toLocaleString();
  }

  return (
    <div className="autopilot-dashboard-page">
      {/* HEADER */}
      <div className="autopilot-dashboard-header">
        <div>
          <h2>🚀 AutoPilot Dashboard</h2>
          <p>
            Monitor accounts, balances, withdrawals and platform performance.
          </p>
        </div>

        <button onClick={loadDashboard}>Refresh</button>
      </div>

      {error && <div className="autopilot-error">{error}</div>}

      {loading ? (
        <div className="autopilot-loading">Loading dashboard...</div>
      ) : (
        <>
          {/* OVERVIEW */}
          <div className="overview-grid">
            <div className="overview-card">
              <span>Total Packages</span>
              <h3>{overview.totalPackages || 0}</h3>
            </div>

            <div className="overview-card">
              <span>Total Accounts</span>
              <h3>{overview.totalAccounts || 0}</h3>
            </div>

            <div className="overview-card">
              <span>Active Accounts</span>
              <h3>{overview.activeAccounts || 0}</h3>
            </div>

            <div className="overview-card">
              <span>Suspended Accounts</span>
              <h3>{overview.suspendedAccounts || 0}</h3>
            </div>

            <div className="overview-card">
              <span>Total Capital Balance</span>
              <h3>{formatAmount(overview.totalCapitalBalance)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Profit Balance</span>
              <h3>{formatAmount(overview.totalProfitBalance)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Profit Earned</span>
              <h3>{formatAmount(overview.totalProfitEarned)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Withdrawals</span>
              <h3>
                {formatAmount(
                  Number(overview.successfulWithdrawalsAmount || 0) +
                    Number(overview.pendingWithdrawalsAmount || 0),
                )}
              </h3>
            </div>
          </div>

          {/* WITHDRAWAL STATUS */}
          <div className="withdrawal-status-grid">
            <div className="status-card pending">
              <span>Pending</span>
              <h3>{formatAmount(overview.pendingWithdrawalsAmount)}</h3>
              <p>{overview.countPendingWithdrawals || 0} requests</p>
            </div>

            <div className="status-card approved">
              <span>Approved</span>
              <h3>{formatAmount(overview.approvedWithdrawalsAmount)}</h3>
              <p>{overview.countApprovedWithdrawals || 0} requests</p>
            </div>

            <div className="status-card processing">
              <span>Processing</span>
              <h3>{formatAmount(overview.processingWithdrawalsAmount)}</h3>
              <p>{overview.countProcessingWithdrawals || 0} requests</p>
            </div>

            <div className="status-card successful">
              <span>Successful</span>
              <h3>{formatAmount(overview.successfulWithdrawalsAmount)}</h3>
              <p>{overview.countSuccessfulWithdrawals || 0} requests</p>
            </div>

            <div className="status-card failed">
              <span>Failed</span>
              <h3>{formatAmount(overview.failedWithdrawalsAmount)}</h3>
              <p>{overview.countFailedWithdrawals || 0} requests</p>
            </div>

            <div className="status-card rejected">
              <span>Rejected</span>
              <h3>{formatAmount(overview.rejectedWithdrawalsAmount)}</h3>
              <p>{overview.countRejectedWithdrawals || 0} requests</p>
            </div>
          </div>

          {/* PACKAGE PERFORMANCE */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>📦 Package Performance</h3>
            </div>

            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Users</th>
                    <th>Active Users</th>
                    <th>Capital Balance</th>
                    <th>Profit Balance</th>
                    <th>Profit Earned</th>
                  </tr>
                </thead>

                <tbody>
                  {packageBreakdown.map((item, index) => (
                    <tr key={index}>
                      <td>{item.packageName}</td>
                      <td>{item.users}</td>
                      <td>{item.activeUsers}</td>
                      <td>{formatAmount(item.totalCapitalBalance)}</td>
                      <td>{formatAmount(item.totalProfitBalance)}</td>
                      <td>{formatAmount(item.totalProfitEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CURRENCY BREAKDOWN */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>💱 Currency Breakdown</h3>
            </div>

            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Deposits</th>
                    <th>Pending Withdrawals</th>
                    <th>Successful Withdrawals</th>
                    <th>Capital Balance</th>
                    <th>Profit Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {byCurrency.map((item, index) => (
                    <tr key={index}>
                      <td>{item.currency}</td>
                      <td>{formatAmount(item.deposits)}</td>
                      <td>{formatAmount(item.pendingWithdrawals)}</td>
                      <td>{formatAmount(item.successfulWithdrawals)}</td>
                      <td>{formatAmount(item.capitalBalance)}</td>
                      <td>{formatAmount(item.profitBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TRANSACTION TYPES */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>🧾 Transaction Types</h3>
            </div>

            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {transactionTypes.map((item, index) => (
                    <tr key={index}>
                      <td>{item.type}</td>
                      <td>{item.count}</td>
                      <td>{formatAmount(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
