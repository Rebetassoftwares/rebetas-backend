import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAutoPilotWithdrawals,
  approveAutoPilotWithdrawal,
  rejectAutoPilotWithdrawal,
  payAutoPilotWithdrawal,
} from "../../../services/adminApi";
import "./AdminAutoPilotWithdrawals.css";

export default function AdminAutoPilotWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  async function loadWithdrawals() {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (status) params.status = status;
      if (type) params.withdrawalType = type;

      const res = await getAutoPilotWithdrawals(params);

      setWithdrawals(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load AutoPilot withdrawals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchWithdrawals() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (status) params.status = status;
        if (type) params.withdrawalType = type;

        const res = await getAutoPilotWithdrawals(params);

        setWithdrawals(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load AutoPilot withdrawals");
      } finally {
        setLoading(false);
      }
    }

    fetchWithdrawals();
  }, [status, type]);

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  async function handleApprove(id) {
    if (!window.confirm("Approve this withdrawal request?")) return;

    try {
      setActionLoading(id);

      await approveAutoPilotWithdrawal(id);

      await loadWithdrawals();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to approve withdrawal");
    } finally {
      setActionLoading("");
    }
  }

  async function handleReject(id) {
    const reason = window.prompt("Enter rejection reason");

    if (!reason) return;

    try {
      setActionLoading(id);

      await rejectAutoPilotWithdrawal(id, {
        reason,
      });

      await loadWithdrawals();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reject withdrawal");
    } finally {
      setActionLoading("");
    }
  }

  async function handlePay(id) {
    if (!window.confirm("Proceed to mark/send this withdrawal for payment?")) {
      return;
    }

    try {
      setActionLoading(id);

      await payAutoPilotWithdrawal(id);

      await loadWithdrawals();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process payment");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="autopilot-withdrawals-page">
      <div className="withdrawals-header">
        <div>
          <h2>🏦 AutoPilot Withdrawals</h2>
          <p>Manage Profit Withdrawal and Capital Withdrawal requests.</p>
        </div>

        <button onClick={loadWithdrawals}>Refresh</button>
      </div>

      {error && <div className="withdrawals-error">{error}</div>}

      <div className="withdrawals-filters">
        <div className="filter-item">
          <label>Status</label>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="successful">Successful</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Withdrawal Type</label>

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="profit">Profit Withdrawal</option>
            <option value="capital">Capital Withdrawal</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="withdrawals-loading">
          Loading AutoPilot Withdrawals...
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="withdrawals-loading">
          No AutoPilot withdrawals found.
        </div>
      ) : (
        <div className="withdrawals-table-card">
          <div className="withdrawals-table-wrapper">
            <table className="withdrawals-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Bank</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {withdrawals.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="withdrawal-user">
                        <strong>
                          {item.user?.fullName ||
                            item.user?.username ||
                            "Unknown User"}
                        </strong>

                        <span>{item.user?.email || "No email"}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`withdrawal-type ${item.withdrawalType}`}
                      >
                        {item.withdrawalType}
                      </span>
                    </td>

                    <td>{formatAmount(item.amount, item.currency)}</td>

                    <td>{formatAmount(item.feeAmount, item.currency)}</td>

                    <td>{formatAmount(item.netAmount, item.currency)}</td>

                    <td>
                      <span className={`withdrawal-status ${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="bank-info">
                        <strong>
                          {item.payoutDetailsSnapshot?.bankName || "No Bank"}
                        </strong>

                        <span>
                          {item.payoutDetailsSnapshot?.accountNumber || "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <div className="withdrawal-actions">
                        <Link to={`/admin/autopilot/withdrawals/${item._id}`}>
                          View
                        </Link>
                        {item.status === "pending" && (
                          <>
                            <button
                              disabled={actionLoading === item._id}
                              onClick={() => handleApprove(item._id)}
                            >
                              Approve
                            </button>

                            <button
                              className="danger-btn"
                              disabled={actionLoading === item._id}
                              onClick={() => handleReject(item._id)}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {item.status === "approved" && (
                          <button
                            className="success-btn"
                            disabled={actionLoading === item._id}
                            onClick={() => handlePay(item._id)}
                          >
                            Pay
                          </button>
                        )}

                        {(item.status === "successful" ||
                          item.status === "processing") && (
                          <span className="completed-badge">Completed</span>
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
