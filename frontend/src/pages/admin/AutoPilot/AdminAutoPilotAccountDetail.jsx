import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAutoPilotAccountById,
  suspendAutoPilotAccount,
  reactivateAutoPilotAccount,
  closeAutoPilotAccount,
  creditManualAutoPilotProfit,
} from "../../../services/adminApi";
import "./AdminAutoPilotAccountDetail.css";

const BASE_CURRENCY = "USD";

export default function AdminAutoPilotAccountDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAccount() {
    try {
      setLoading(true);
      setError("");

      const res = await getAutoPilotAccountById(id);

      setData(res?.data || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load AutoPilot account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const account = data?.account;
  const user = data?.user;

  const recentTransactions = data?.recentTransactions || [];
  const recentWithdrawals = data?.recentWithdrawals || [];

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  function localAmount(value) {
    return formatAmount(
      value,
      account?.localCurrency || account?.currency || "",
    );
  }

  function baseAmount(value) {
    return formatAmount(value, account?.baseCurrency || BASE_CURRENCY);
  }

  function MoneyStack({ localValue, baseValue }) {
    return (
      <div className="money-stack">
        <strong>{baseAmount(baseValue)}</strong>
        <span>{localAmount(localValue)}</span>
      </div>
    );
  }

  async function handleSuspend() {
    if (!window.confirm("Suspend this AutoPilot account?")) return;

    try {
      setActionLoading(true);

      await suspendAutoPilotAccount(id);

      await loadAccount();
    } catch (err) {
      console.error(err);
      setError("Failed to suspend AutoPilot account");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    if (!window.confirm("Reactivate this AutoPilot account?")) return;

    try {
      setActionLoading(true);

      await reactivateAutoPilotAccount(id);

      await loadAccount();
    } catch (err) {
      console.error(err);
      setError("Failed to reactivate AutoPilot account");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    if (!window.confirm("Close this AutoPilot account?")) return;

    try {
      setActionLoading(true);

      await closeAutoPilotAccount(id);

      await loadAccount();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to close AutoPilot account");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManualCredit(e) {
    e.preventDefault();

    if (!manualAmount || Number(manualAmount) <= 0) {
      setError("Enter a valid Profit Credit amount");
      return;
    }

    if (!window.confirm("Apply this Manual Profit Credit?")) return;

    try {
      setActionLoading(true);
      setError("");

      await creditManualAutoPilotProfit(id, {
        amount: Number(manualAmount),
        reason: manualReason,
      });

      setManualAmount("");
      setManualReason("");

      await loadAccount();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to apply Manual Profit Credit");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="autopilot-detail-loading">Loading account...</div>;
  }

  if (!account) {
    return <div className="autopilot-detail-loading">Account not found.</div>;
  }

  return (
    <div className="autopilot-account-detail-page">
      <div className="account-detail-header">
        <div>
          <Link to="/admin/autopilot/accounts">← Back to Accounts</Link>

          <h2>👤 AutoPilot Account Detail</h2>

          <p>
            View balances, exchange tracking, recent activity and admin actions.
          </p>
        </div>

        <button onClick={loadAccount}>Refresh</button>
      </div>

      {error && <div className="autopilot-detail-error">{error}</div>}

      <div className="account-detail-grid">
        <div className="detail-card user-card">
          <h3>User Information</h3>

          <p>
            <span>Name</span>

            <strong>
              {user?.fullName || user?.username || "Unknown User"}
            </strong>
          </p>

          <p>
            <span>Email</span>

            <strong>{user?.email || "No email"}</strong>
          </p>

          <p>
            <span>Phone</span>

            <strong>{user?.phone || "No phone"}</strong>
          </p>

          <p>
            <span>Country</span>

            <strong>{user?.country || "No country"}</strong>
          </p>

          <p>
            <span>Local Currency</span>

            <strong>{account.localCurrency || account.currency || "—"}</strong>
          </p>

          <p>
            <span>Exchange Rate</span>

            <strong>
              {account.exchangeRateSnapshot
                ? `1 ${account.baseCurrency || BASE_CURRENCY} = ${Number(
                    account.exchangeRateSnapshot,
                  ).toLocaleString()} ${
                    account.localCurrency || account.currency || ""
                  }`
                : "Not available"}
            </strong>
          </p>
        </div>

        <div className="detail-card">
          <h3>Package Information</h3>

          <p>
            <span>Package</span>

            <strong>
              {account.packageNameSnapshot || account.packageId?.name}
            </strong>
          </p>

          <p>
            <span>Package Amount</span>

            <MoneyStack
              localValue={account.packageAmountSnapshot}
              baseValue={account.basePackageAmountSnapshot}
            />
          </p>

          <p>
            <span>Daily Return</span>

            <strong>{account.dailyReturnPercentageSnapshot || 0}%</strong>
          </p>

          <p>
            <span>Status</span>

            <strong className={`detail-status ${account.status}`}>
              {account.status}
            </strong>
          </p>
        </div>
      </div>

      <div className="balance-grid">
        <div className="balance-card">
          <span>Capital Balance</span>

          <MoneyStack
            localValue={account.capitalBalance}
            baseValue={account.baseCapitalBalance}
          />
        </div>

        <div className="balance-card">
          <span>Profit Balance</span>

          <MoneyStack
            localValue={account.profitBalance}
            baseValue={account.baseProfitBalance}
          />
        </div>

        <div className="balance-card">
          <span>Total Profit Earned</span>

          <MoneyStack
            localValue={account.totalProfitEarned}
            baseValue={account.baseTotalProfitEarned}
          />
        </div>

        <div className="balance-card">
          <span>Total Profit Withdrawn</span>

          <MoneyStack
            localValue={account.totalProfitWithdrawn}
            baseValue={account.baseTotalProfitWithdrawn}
          />
        </div>

        <div className="balance-card">
          <span>Total Capital Withdrawn</span>

          <MoneyStack
            localValue={account.totalCapitalWithdrawn}
            baseValue={account.baseTotalCapitalWithdrawn}
          />
        </div>

        <div className="balance-card">
          <span>Last Profit Credit</span>

          <h3>
            {account.lastProfitCreditedAt
              ? new Date(account.lastProfitCreditedAt).toLocaleDateString()
              : "Not yet"}
          </h3>
        </div>
      </div>

      <div className="admin-action-grid">
        <div className="detail-card">
          <h3>Account Actions</h3>

          <div className="detail-actions">
            {account.status === "active" && (
              <button disabled={actionLoading} onClick={handleSuspend}>
                Suspend Account
              </button>
            )}

            {account.status === "suspended" && (
              <button disabled={actionLoading} onClick={handleReactivate}>
                Reactivate Account
              </button>
            )}

            {account.status !== "closed" && (
              <button
                className="danger-btn"
                disabled={actionLoading}
                onClick={handleClose}
              >
                Close Account
              </button>
            )}
          </div>
        </div>

        <form
          className="detail-card manual-credit-form"
          onSubmit={handleManualCredit}
        >
          <h3>Manual Profit Credit</h3>

          <input
            type="number"
            placeholder={`Amount in ${
              account.localCurrency || account.currency || ""
            }`}
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
          />

          <textarea
            placeholder="Reason for Manual Profit Credit"
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
          />

          <button
            type="submit"
            disabled={actionLoading || account.status !== "active"}
          >
            Apply Profit Credit
          </button>

          <p className="small-warning">
            Admin finance tracking automatically converts this Profit Credit
            into USD equivalent.
          </p>

          {account.status !== "active" && (
            <p className="small-warning">
              Profit Credit can only be applied to an active AutoPilot account.
            </p>
          )}
        </form>
      </div>

      <div className="detail-section">
        <h3>🧾 Recent Transactions</h3>

        <div className="detail-table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>USD Value</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6">No recent transactions.</td>
                </tr>
              ) : (
                recentTransactions.map((item) => (
                  <tr key={item._id}>
                    <td>{item.type}</td>

                    <td>{item.status}</td>

                    <td>
                      {formatAmount(
                        item.amount,
                        item.localCurrency || item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.baseAmount,
                        item.baseCurrency || BASE_CURRENCY,
                      )}
                    </td>

                    <td>{item.description || "—"}</td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="detail-section">
        <h3>🏦 Recent Withdrawals</h3>

        <div className="detail-table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>USD Value</th>
                <th>Fee</th>
                <th>Net Amount</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7">No recent withdrawals.</td>
                </tr>
              ) : (
                recentWithdrawals.map((item) => (
                  <tr key={item._id}>
                    <td>{item.withdrawalType}</td>

                    <td>{item.status}</td>

                    <td>
                      {formatAmount(
                        item.amount,
                        item.localCurrency || item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.baseAmount,
                        item.baseCurrency || BASE_CURRENCY,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.feeAmount,
                        item.localCurrency || item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.netAmount,
                        item.localCurrency || item.currency,
                      )}
                    </td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
