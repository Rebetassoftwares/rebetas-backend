import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAutoPilotAccounts,
  suspendAutoPilotAccount,
  reactivateAutoPilotAccount,
  closeAutoPilotAccount,
} from "../../../services/adminApi";
import "./AdminAutoPilotAccounts.css";

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
      console.error(err);
      setError("Failed to load AutoPilot Accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        setError("");

        const res = await getAutoPilotAccounts(status ? { status } : {});
        setAccounts(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load AutoPilot Accounts");
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [status]);

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  async function handleSuspend(id) {
    if (!window.confirm("Suspend this AutoPilot account?")) return;

    try {
      setActionLoading(id);
      await suspendAutoPilotAccount(id);
      loadAccounts();
    } catch (err) {
      console.error(err);
      setError("Failed to suspend AutoPilot account");
    } finally {
      setActionLoading("");
    }
  }

  async function handleReactivate(id) {
    if (!window.confirm("Reactivate this AutoPilot account?")) return;

    try {
      setActionLoading(id);
      await reactivateAutoPilotAccount(id);
      loadAccounts();
    } catch (err) {
      console.error(err);
      setError("Failed to reactivate AutoPilot account");
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
      await closeAutoPilotAccount(id);
      loadAccounts();
    } catch (err) {
      console.error(err);
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
          <p>Manage user AutoPilot accounts, balances and account status.</p>
        </div>

        <button onClick={loadAccounts}>Refresh</button>
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
                      </div>
                    </td>

                    <td>
                      {account.packageNameSnapshot ||
                        account.packageId?.name ||
                        "Package"}
                    </td>

                    <td>
                      {formatAmount(account.capitalBalance, account.currency)}
                    </td>

                    <td>
                      {formatAmount(account.profitBalance, account.currency)}
                    </td>

                    <td>
                      {formatAmount(
                        account.totalProfitEarned,
                        account.currency,
                      )}
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
                            disabled={actionLoading === account._id}
                            onClick={() => handleSuspend(account._id)}
                          >
                            Suspend
                          </button>
                        )}

                        {account.status === "suspended" && (
                          <button
                            disabled={actionLoading === account._id}
                            onClick={() => handleReactivate(account._id)}
                          >
                            Reactivate
                          </button>
                        )}

                        {account.status !== "closed" && (
                          <button
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
