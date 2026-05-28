import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAutoPilotAccounts,
  suspendAutoPilotAccount,
  reactivateAutoPilotAccount,
  closeAutoPilotAccount,
} from "../../../services/adminApi";
import "./AdminAutoPilotAccounts.css";

const BASE_CURRENCY = "USD";

export default function AdminAutoPilotAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");

      const res = await getAutoPilotAccounts(status ? { status } : {});

      setAccounts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Load AutoPilot Accounts error:", err);
      setError(err.message || "Failed to load AutoPilot Accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  function formatLocalAmount(value, account) {
    return formatAmount(value, account.localCurrency || account.currency || "");
  }

  function formatBaseAmount(value, account) {
    return formatAmount(value, account.baseCurrency || BASE_CURRENCY);
  }

  function MoneyStack({ localValue, baseValue, account }) {
    return (
      <div className="money-stack">
        <strong>{formatBaseAmount(baseValue, account)}</strong>
        <span>{formatLocalAmount(localValue, account)}</span>
      </div>
    );
  }

  async function handleSuspend(id) {
    if (!window.confirm("Suspend this AutoPilot account?")) return;

    try {
      setActionLoading(id);
      setError("");

      await suspendAutoPilotAccount(id);
      await loadAccounts();
    } catch (err) {
      console.error("Suspend AutoPilot account error:", err);
      setError(err.message || "Failed to suspend AutoPilot account");
    } finally {
      setActionLoading("");
    }
  }

  async function handleReactivate(id) {
    if (!window.confirm("Reactivate this AutoPilot account?")) return;

    try {
      setActionLoading(id);
      setError("");

      await reactivateAutoPilotAccount(id);
      await loadAccounts();
    } catch (err) {
      console.error("Reactivate AutoPilot account error:", err);
      setError(err.message || "Failed to reactivate AutoPilot account");
    } finally {
      setActionLoading("");
    }
  }

  async function handleClose(id) {
    if (
      !window.confirm(
        "Close this AutoPilot account? Make sure there is no pending withdrawal.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(id);
      setError("");

      await closeAutoPilotAccount(id);
      await loadAccounts();
    } catch (err) {
      console.error("Close AutoPilot account error:", err);
      setError(err.message || "Failed to close AutoPilot account");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="autopilot-accounts-page">
      <div className="autopilot-accounts-header">
        <div>
          <h2>👤 AutoPilot Accounts</h2>
          <p>
            Manage user AutoPilot accounts, local balances, and admin USD
            tracking.
          </p>
        </div>

        <button type="button" onClick={loadAccounts} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="autopilot-accounts-error">{error}</div>}

      <div className="accounts-filter-card">
        <label>Status Filter</label>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Accounts</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="accounts-loading">Loading AutoPilot Accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="accounts-loading">No AutoPilot Accounts found.</div>
      ) : (
        <div className="accounts-table-card">
          <div className="accounts-table-wrapper">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Package</th>
                  <th>Capital Balance</th>
                  <th>Profit Balance</th>
                  <th>Total Profit Earned</th>
                  <th>Currency / Rate</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td>
                      <div className="user-cell">
                        <strong>
                          {account.user?.fullName ||
                            account.user?.username ||
                            "Unknown User"}
                        </strong>
                        <span>{account.user?.email || "No email"}</span>
                        <span>{account.user?.country || "No country"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="package-cell">
                        <strong>
                          {account.packageNameSnapshot ||
                            account.packageId?.name ||
                            "Package"}
                        </strong>

                        <span>
                          Package:{" "}
                          {formatBaseAmount(
                            account.basePackageAmountSnapshot,
                            account,
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <MoneyStack
                        localValue={account.capitalBalance}
                        baseValue={account.baseCapitalBalance}
                        account={account}
                      />
                    </td>

                    <td>
                      <MoneyStack
                        localValue={account.profitBalance}
                        baseValue={account.baseProfitBalance}
                        account={account}
                      />
                    </td>

                    <td>
                      <MoneyStack
                        localValue={account.totalProfitEarned}
                        baseValue={account.baseTotalProfitEarned}
                        account={account}
                      />
                    </td>

                    <td>
                      <div className="currency-cell">
                        <strong>
                          {account.localCurrency || account.currency || "—"}
                        </strong>

                        <span>
                          Rate:{" "}
                          {account.exchangeRateSnapshot
                            ? `1 ${account.baseCurrency || BASE_CURRENCY} = ${Number(
                                account.exchangeRateSnapshot,
                              ).toLocaleString()} ${
                                account.localCurrency || account.currency || ""
                              }`
                            : "Not available"}
                        </span>

                        {!account.hasValidExchangeRate && (
                          <small>Missing exchange rate</small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`account-status ${account.status}`}>
                        {account.status}
                      </span>
                    </td>

                    <td>
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="account-actions">
                        <Link to={`/admin/autopilot/accounts/${account._id}`}>
                          View
                        </Link>

                        {account.status === "active" && (
                          <button
                            type="button"
                            disabled={actionLoading === account._id}
                            onClick={() => handleSuspend(account._id)}
                          >
                            Suspend
                          </button>
                        )}

                        {account.status === "suspended" && (
                          <button
                            type="button"
                            disabled={actionLoading === account._id}
                            onClick={() => handleReactivate(account._id)}
                          >
                            Reactivate
                          </button>
                        )}

                        {account.status !== "closed" && (
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={actionLoading === account._id}
                            onClick={() => handleClose(account._id)}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
