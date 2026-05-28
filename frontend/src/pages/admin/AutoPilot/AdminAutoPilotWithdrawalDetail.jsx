import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAutoPilotWithdrawalById,
  getAutoPilotWithdrawalAudit,
  approveAutoPilotWithdrawal,
  rejectAutoPilotWithdrawal,
  payAutoPilotWithdrawal,
} from "../../../services/adminApi";
import "./AdminAutoPilotWithdrawalDetail.css";

const BASE_CURRENCY = "USD";

export default function AdminAutoPilotWithdrawalDetail() {
  const { id } = useParams();

  const [withdrawal, setWithdrawal] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [withdrawalRes, auditRes] = await Promise.all([
        getAutoPilotWithdrawalById(id),
        getAutoPilotWithdrawalAudit(id),
      ]);

      setWithdrawal(withdrawalRes?.data || null);
      setAuditLogs(
        Array.isArray(auditRes?.data)
          ? auditRes.data
          : auditRes?.data?.logs || [],
      );
    } catch (err) {
      console.error("Load withdrawal detail error:", err);
      setError(err.message || "Failed to load withdrawal details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  function getLocalCurrency() {
    return withdrawal?.localCurrency || withdrawal?.currency || "";
  }

  function getBaseCurrency() {
    return withdrawal?.baseCurrency || BASE_CURRENCY;
  }

  function MoneyStack({ localValue, baseValue }) {
    return (
      <div className="money-stack">
        <strong>{formatAmount(baseValue, getBaseCurrency())}</strong>
        <span>{formatAmount(localValue, getLocalCurrency())}</span>
      </div>
    );
  }

  async function handleApprove() {
    if (!window.confirm("Approve this withdrawal?")) return;

    try {
      setActionLoading(true);
      setError("");

      await approveAutoPilotWithdrawal(id);
      await loadData();
    } catch (err) {
      console.error("Approve withdrawal error:", err);
      setError(err.message || "Failed to approve withdrawal");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt("Enter rejection reason");
    if (!reason) return;

    try {
      setActionLoading(true);
      setError("");

      await rejectAutoPilotWithdrawal(id, { reason });
      await loadData();
    } catch (err) {
      console.error("Reject withdrawal error:", err);
      setError(err.message || "Failed to reject withdrawal");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay() {
    if (!window.confirm("Proceed with payment?")) return;

    try {
      setActionLoading(true);
      setError("");

      await payAutoPilotWithdrawal(id);
      await loadData();
    } catch (err) {
      console.error("Process withdrawal payment error:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="withdrawal-detail-loading">
        Loading withdrawal details...
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div className="withdrawal-detail-loading">Withdrawal not found.</div>
    );
  }

  return (
    <div className="withdrawal-detail-page">
      <div className="withdrawal-detail-header">
        <div>
          <Link to="/admin/autopilot/withdrawals">← Back to Withdrawals</Link>
          <h2>🏦 Withdrawal Detail</h2>
          <p>
            Review withdrawal information, local payout value, USD tracking,
            payment status and audit logs.
          </p>
        </div>

        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="withdrawal-detail-error">{error}</div>}

      <div className="withdrawal-summary-grid">
        <div className="withdrawal-card">
          <h3>User Information</h3>

          <p>
            <span>Name</span>
            <strong>
              {withdrawal.user?.fullName ||
                withdrawal.user?.username ||
                "Unknown User"}
            </strong>
          </p>

          <p>
            <span>Email</span>
            <strong>{withdrawal.user?.email || "No email"}</strong>
          </p>

          <p>
            <span>Phone</span>
            <strong>{withdrawal.user?.phone || "No phone"}</strong>
          </p>

          <p>
            <span>Country</span>
            <strong>{withdrawal.user?.country || "No country"}</strong>
          </p>

          <p>
            <span>Local Currency</span>
            <strong>{getLocalCurrency() || "—"}</strong>
          </p>
        </div>

        <div className="withdrawal-card">
          <h3>Withdrawal Information</h3>

          <p>
            <span>Type</span>
            <strong className={`withdrawal-type ${withdrawal.withdrawalType}`}>
              {withdrawal.withdrawalType}
            </strong>
          </p>

          <p>
            <span>Status</span>
            <strong className={`withdrawal-status ${withdrawal.status}`}>
              {withdrawal.status}
            </strong>
          </p>

          <p>
            <span>Amount</span>
            <MoneyStack
              localValue={withdrawal.amount}
              baseValue={withdrawal.baseAmount}
            />
          </p>

          <p>
            <span>Fee</span>
            <MoneyStack
              localValue={withdrawal.feeAmount}
              baseValue={withdrawal.baseFeeAmount}
            />
          </p>

          <p>
            <span>Net Amount</span>
            <MoneyStack
              localValue={withdrawal.netAmount}
              baseValue={withdrawal.baseNetAmount}
            />
          </p>

          <p>
            <span>Exchange Rate</span>
            <strong>
              {withdrawal.exchangeRateSnapshot
                ? `1 ${getBaseCurrency()} = ${Number(
                    withdrawal.exchangeRateSnapshot,
                  ).toLocaleString()} ${getLocalCurrency()}`
                : "—"}
            </strong>
          </p>

          <p>
            <span>Fee Policy</span>
            <strong>
              {withdrawal.feePolicy === "user_pays"
                ? "User pays fee"
                : "Platform pays fee"}
            </strong>
          </p>
        </div>
      </div>

      <div className="withdrawal-summary-grid">
        <div className="withdrawal-card">
          <h3>Bank Details</h3>

          <p>
            <span>Bank Name</span>
            <strong>
              {withdrawal.payoutDetailsSnapshot?.bankName ||
                withdrawal.payoutDetails?.bankName ||
                "—"}
            </strong>
          </p>

          <p>
            <span>Account Name</span>
            <strong>
              {withdrawal.payoutDetailsSnapshot?.accountName ||
                withdrawal.payoutDetails?.accountName ||
                "—"}
            </strong>
          </p>

          <p>
            <span>Account Number</span>
            <strong>
              {withdrawal.payoutDetailsSnapshot?.accountNumber ||
                withdrawal.payoutDetails?.accountNumber ||
                "—"}
            </strong>
          </p>

          <p>
            <span>Bank Code</span>
            <strong>
              {withdrawal.payoutDetailsSnapshot?.bankCode ||
                withdrawal.payoutDetails?.bankCode ||
                "—"}
            </strong>
          </p>
        </div>

        <div className="withdrawal-card">
          <h3>Provider Information</h3>

          <p>
            <span>Reference</span>
            <strong>{withdrawal.reference || "—"}</strong>
          </p>

          <p>
            <span>Provider Reference</span>
            <strong>{withdrawal.providerReference || "—"}</strong>
          </p>

          <p>
            <span>Transfer ID</span>
            <strong>{withdrawal.providerTransferId || "—"}</strong>
          </p>

          <p>
            <span>Processed At</span>
            <strong>
              {withdrawal.processedAt
                ? new Date(withdrawal.processedAt).toLocaleString()
                : "—"}
            </strong>
          </p>

          <p>
            <span>Paid At</span>
            <strong>
              {withdrawal.paidAt
                ? new Date(withdrawal.paidAt).toLocaleString()
                : "—"}
            </strong>
          </p>

          <p>
            <span>Created</span>
            <strong>
              {withdrawal.createdAt
                ? new Date(withdrawal.createdAt).toLocaleString()
                : "—"}
            </strong>
          </p>
        </div>
      </div>

      <div className="withdrawal-card">
        <h3>Admin Actions</h3>

        <div className="withdrawal-actions">
          {withdrawal.status === "pending" && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
              >
                Approve Withdrawal
              </button>

              <button
                type="button"
                className="danger-btn"
                disabled={actionLoading}
                onClick={handleReject}
              >
                Reject Withdrawal
              </button>
            </>
          )}

          {withdrawal.status === "approved" && (
            <button
              type="button"
              className="success-btn"
              disabled={actionLoading}
              onClick={handlePay}
            >
              Process Payment
            </button>
          )}

          {withdrawal.status === "processing" && (
            <div className="processing-state">
              Withdrawal payment is processing.
            </div>
          )}

          {withdrawal.status === "successful" && (
            <div className="completed-state">
              Withdrawal completed successfully.
            </div>
          )}

          {["failed", "rejected"].includes(withdrawal.status) && (
            <div className="failed-state">
              Withdrawal is {withdrawal.status}.
            </div>
          )}
        </div>
      </div>

      {withdrawal.failureReason && (
        <div className="withdrawal-card">
          <h3>Failure / Rejection Reason</h3>
          <p>{withdrawal.failureReason}</p>
        </div>
      )}

      {withdrawal.adminNote && (
        <div className="withdrawal-card">
          <h3>Admin Note</h3>
          <p>{withdrawal.adminNote}</p>
        </div>
      )}

      <div className="withdrawal-card">
        <h3>Audit Logs</h3>

        {auditLogs.length === 0 ? (
          <div className="empty-audit">No audit logs available.</div>
        ) : (
          <div className="audit-list">
            {auditLogs.map((log, index) => (
              <div key={log._id || index} className="audit-item">
                <div className="audit-top">
                  <strong>{log.action || "Action"}</strong>

                  <span>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>

                <p>{log.message || log.note || "No details"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
