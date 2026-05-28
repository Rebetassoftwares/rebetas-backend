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
  const baseCurrency =
    dashboard?.baseCurrency || overview?.baseCurrency || "USD";

  function formatCount(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatMoney(value) {
    return `${baseCurrency} ${Number(value || 0).toLocaleString()}`;
  }

  const totalWithdrawals =
    Number(overview.pendingWithdrawalsAmount || 0) +
    Number(overview.approvedWithdrawalsAmount || 0) +
    Number(overview.processingWithdrawalsAmount || 0) +
    Number(overview.successfulWithdrawalsAmount || 0);

  return (
    <div className="autopilot-dashboard-page">
      <div className="autopilot-dashboard-header">
        <div>
          <h2>🚀 AutoPilot Dashboard</h2>
          <p>
            Monitor AutoPilot accounts, USD balances, withdrawals, and platform
            performance.
          </p>
        </div>

        <button onClick={loadDashboard}>Refresh</button>
      </div>

      {error && <div className="autopilot-error">{error}</div>}

      {loading ? (
        <div className="autopilot-loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="overview-grid">
            <div className="overview-card">
              <span>Total Packages</span>
              <h3>{formatCount(overview.totalPackages)}</h3>
            </div>

            <div className="overview-card">
              <span>Active Packages</span>
              <h3>{formatCount(overview.activePackages)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Accounts</span>
              <h3>{formatCount(overview.totalAccounts)}</h3>
            </div>

            <div className="overview-card">
              <span>Active Accounts</span>
              <h3>{formatCount(overview.activeAccounts)}</h3>
            </div>

            <div className="overview-card">
              <span>Suspended Accounts</span>
              <h3>{formatCount(overview.suspendedAccounts)}</h3>
            </div>

            <div className="overview-card">
              <span>Closed Accounts</span>
              <h3>{formatCount(overview.closedAccounts)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Deposits ({baseCurrency})</span>
              <h3>{formatMoney(overview.totalDepositsAmount)}</h3>
            </div>

            <div className="overview-card">
              <span>Successful Deposits ({baseCurrency})</span>
              <h3>{formatMoney(overview.successfulDepositsAmount)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Capital Balance ({baseCurrency})</span>
              <h3>{formatMoney(overview.totalCapitalBalance)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Profit Balance ({baseCurrency})</span>
              <h3>{formatMoney(overview.totalProfitBalance)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Profit Earned ({baseCurrency})</span>
              <h3>{formatMoney(overview.totalProfitEarned)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Withdrawals ({baseCurrency})</span>
              <h3>{formatMoney(totalWithdrawals)}</h3>
            </div>

            <div className="overview-card">
              <span>Total Fees ({baseCurrency})</span>
              <h3>{formatMoney(overview.totalFees)}</h3>
            </div>

            <div className="overview-card">
              <span>Missing Exchange Rates</span>
              <h3>{formatCount(overview.missingExchangeRateCount)}</h3>
            </div>
          </div>

          <div className="withdrawal-status-grid">
            <div className="status-card pending">
              <span>Pending ({baseCurrency})</span>
              <h3>{formatMoney(overview.pendingWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countPendingWithdrawals)} requests</p>
            </div>

            <div className="status-card approved">
              <span>Approved ({baseCurrency})</span>
              <h3>{formatMoney(overview.approvedWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countApprovedWithdrawals)} requests</p>
            </div>

            <div className="status-card processing">
              <span>Processing ({baseCurrency})</span>
              <h3>{formatMoney(overview.processingWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countProcessingWithdrawals)} requests</p>
            </div>

            <div className="status-card successful">
              <span>Successful ({baseCurrency})</span>
              <h3>{formatMoney(overview.successfulWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countSuccessfulWithdrawals)} requests</p>
            </div>

            <div className="status-card failed">
              <span>Failed ({baseCurrency})</span>
              <h3>{formatMoney(overview.failedWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countFailedWithdrawals)} requests</p>
            </div>

            <div className="status-card rejected">
              <span>Rejected ({baseCurrency})</span>
              <h3>{formatMoney(overview.rejectedWithdrawalsAmount)}</h3>
              <p>{formatCount(overview.countRejectedWithdrawals)} requests</p>
            </div>
          </div>

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
                    <th>Capital Balance ({baseCurrency})</th>
                    <th>Profit Balance ({baseCurrency})</th>
                    <th>Profit Earned ({baseCurrency})</th>
                  </tr>
                </thead>

                <tbody>
                  {packageBreakdown.length > 0 ? (
                    packageBreakdown.map((item, index) => (
                      <tr key={item.packageId || index}>
                        <td>{item.packageName}</td>
                        <td>{formatCount(item.users)}</td>
                        <td>{formatCount(item.activeUsers)}</td>
                        <td>{formatMoney(item.totalCapitalBalance)}</td>
                        <td>{formatMoney(item.totalProfitBalance)}</td>
                        <td>{formatMoney(item.totalProfitEarned)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">No package performance yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h3>💱 Currency Breakdown</h3>
              <p>
                Amounts below are shown in {baseCurrency}, grouped by users'
                local currency.
              </p>
            </div>

            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>User Currency</th>
                    <th>Deposits ({baseCurrency})</th>
                    <th>Pending Withdrawals ({baseCurrency})</th>
                    <th>Successful Withdrawals ({baseCurrency})</th>
                    <th>Capital Balance ({baseCurrency})</th>
                    <th>Profit Balance ({baseCurrency})</th>
                    <th>Fees ({baseCurrency})</th>
                  </tr>
                </thead>

                <tbody>
                  {byCurrency.length > 0 ? (
                    byCurrency.map((item, index) => (
                      <tr key={item.currency || index}>
                        <td>{item.currency}</td>
                        <td>{formatMoney(item.deposits)}</td>
                        <td>{formatMoney(item.pendingWithdrawals)}</td>
                        <td>{formatMoney(item.successfulWithdrawals)}</td>
                        <td>{formatMoney(item.capitalBalance)}</td>
                        <td>{formatMoney(item.profitBalance)}</td>
                        <td>{formatMoney(item.fees)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No currency breakdown yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                    <th>Amount ({baseCurrency})</th>
                  </tr>
                </thead>

                <tbody>
                  {transactionTypes.length > 0 ? (
                    transactionTypes.map((item, index) => (
                      <tr key={item.type || index}>
                        <td>{String(item.type || "").replaceAll("_", " ")}</td>
                        <td>{formatCount(item.count)}</td>
                        <td>{formatMoney(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No transactions yet.</td>
                    </tr>
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
