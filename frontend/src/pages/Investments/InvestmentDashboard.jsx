import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./InvestmentDashboard.css";

export default function InvestmentDashboard() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [referral, setReferral] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeAction, setActiveAction] = useState(null);
  const [amount, setAmount] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/investments/dashboard");

      setAccount(res?.data?.account || null);
      setPayoutDetails(res?.data?.payoutDetails || null);
      setReferral(res?.data?.referral || null);
      setHistory(
        Array.isArray(res?.data?.recentTransactions)
          ? res.data.recentTransactions
          : [],
      );
    } catch (err) {
      console.error("AutoPilot dashboard error:", err);
      setError(err.message || "Failed to load AutoPilot dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const params = new URLSearchParams();

      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);

      const query = params.toString();

      const res = await api.get(
        query ? `/investments/history?${query}` : "/investments/history",
      );

      setHistory(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("AutoPilot history error:", err);
      setError(err.message || "Failed to load AutoPilot history.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (loading) return;

    async function fetchHistory() {
      try {
        const params = new URLSearchParams();

        if (typeFilter !== "all") params.append("type", typeFilter);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (dateFilter) params.append("date", dateFilter);

        const query = params.toString();

        const res = await api.get(
          query ? `/investments/history?${query}` : "/investments/history",
        );

        setHistory(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error("AutoPilot history error:", err);
        setError(err.message || "Failed to load AutoPilot history.");
      }
    }

    fetchHistory();
  }, [typeFilter, statusFilter, dateFilter, loading]);

  const currency = account?.currency || account?.userDisplayCurrency || "";

  const formatMoney = (value) => {
    return `${currency || ""} ${Number(value || 0).toLocaleString()}`;
  };

  const referralCurrency = referral?.currency || currency;

  const formatReferralMoney = (value) => {
    return `${referralCurrency || ""} ${Number(value || 0).toLocaleString()}`;
  };

  const capitalWithdrawAvailableAt = account?.capitalWithdrawAvailableAt
    ? new Date(account.capitalWithdrawAvailableAt)
    : null;

  let capitalDaysLeft = 0;

  if (capitalWithdrawAvailableAt) {
    const diff = capitalWithdrawAvailableAt - new Date();
    capitalDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const canWithdrawCapital = !!account && capitalDaysLeft === 0;

  function resetAction() {
    setActiveAction(null);
    setAmount("");
  }

  function validateProfitAmount() {
    const value = Number(amount);

    if (!value || value <= 0) {
      alert("Enter a valid amount");
      return null;
    }

    if (value > Number(account?.profitBalance || 0)) {
      alert("Amount cannot be greater than your Profit Balance");
      return null;
    }

    return value;
  }

  function validateReferralAmount() {
    const value = Number(amount);

    if (!value || value <= 0) {
      alert("Enter a valid amount");
      return null;
    }

    if (value > Number(referral?.referralBalance || 0)) {
      alert("Amount cannot be greater than your Referral Balance");
      return null;
    }

    return value;
  }

  async function handleWithdrawProfit() {
    if (!payoutDetails) {
      alert("Please add payout details before withdrawing.");
      navigate("/payout-details");
      return;
    }

    const value = validateProfitAmount();

    if (!value) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post("/investments/withdraw-profit", {
        amount: value,
      });

      resetAction();
      await loadDashboard();
      await loadHistory();

      alert("Profit Withdrawal request submitted successfully.");
    } catch (err) {
      console.error("Profit Withdrawal error:", err);
      setError(err.message || "Failed to submit Profit Withdrawal.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompoundProfit() {
    const value = validateProfitAmount();

    if (!value) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post("/investments/compound", {
        amount: value,
      });

      resetAction();
      await loadDashboard();
      await loadHistory();

      alert("Compound Profit completed successfully.");
    } catch (err) {
      console.error("Compound Profit error:", err);
      setError(err.message || "Failed to complete Compound Profit.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompoundReferral() {
    const value = validateReferralAmount();

    if (!value) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post("/investments/compound-referral", {
        amount: value,
      });

      resetAction();
      await loadDashboard();
      await loadHistory();

      alert("Referral Balance compounded successfully.");
    } catch (err) {
      console.error("Compound Referral error:", err);
      setError(err.message || "Failed to compound Referral Balance.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdrawReferral() {
    if (!payoutDetails) {
      alert("Please add payout details before withdrawing.");
      navigate("/payout-details");
      return;
    }

    const value = validateReferralAmount();

    if (!value) return;

    try {
      setActionLoading(true);
      setError("");

      await api.post("/investments/withdraw-referral", {
        amount: value,
      });

      resetAction();
      await loadDashboard();
      await loadHistory();

      alert("Referral Withdrawal request submitted successfully.");
    } catch (err) {
      console.error("Referral Withdrawal error:", err);
      setError(err.message || "Failed to submit Referral Withdrawal.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdrawCapital() {
    if (!payoutDetails) {
      alert("Please add payout details before withdrawing.");
      navigate("/payout-details");
      return;
    }

    if (!canWithdrawCapital) {
      alert(`Capital Withdrawal is available in ${capitalDaysLeft} days.`);
      return;
    }

    if (
      !window.confirm(
        "This will request withdrawal of your full Capital Balance. Continue?",
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post("/investments/withdraw-capital", {});

      await loadDashboard();
      await loadHistory();

      alert("Capital Withdrawal request submitted successfully.");
    } catch (err) {
      console.error("Capital Withdrawal error:", err);
      setError(err.message || "Failed to submit Capital Withdrawal.");
    } finally {
      setActionLoading(false);
    }
  }

  function formatType(type = "") {
    return String(type).replaceAll("_", " ");
  }

  function formatDateTime(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString();
  }

  if (loading) {
    return (
      <div className="auto-dashboard-page">
        <DashboardNavbar />

        <main className="auto-dashboard-container">
          <section className="dashboard-loading">
            Loading AutoPilot dashboard...
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="auto-dashboard-page">
        <DashboardNavbar />

        <main className="auto-dashboard-container">
          <section className="dashboard-empty">
            <h2>No active AutoPilot account</h2>
            <p>
              You do not have an active AutoPilot account yet. Select a Package
              to get started.
            </p>

            <button onClick={() => navigate("/investments")}>
              View AutoPilot Packages
            </button>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="auto-dashboard-page">
      <DashboardNavbar />

      <main className="auto-dashboard-container">
        <section className="account-overview">
          <div className="overview-left">
            <span className="bank-label">Rebetas AutoPilot</span>

            <h1>{account.packageNameSnapshot} Package</h1>

            <p>{account.status} account</p>

            <div className="account-owner-box">
              <span>AutoPilot Account</span>

              <strong>{account.packageNameSnapshot}</strong>

              <small>
                Daily Profit Credit:{" "}
                {Number(account.dailyReturnPercentageSnapshot || 0)}%
              </small>

              <div className="owner-package-amount">
                <label>Package Amount</label>
                <h3>{formatMoney(account.packageAmountSnapshot)}</h3>
              </div>
            </div>
          </div>

          <div className="account-overview-actions">
            <div className="account-status-pill">
              {canWithdrawCapital
                ? "Capital Withdrawal available"
                : `Capital available in ${capitalDaysLeft} days`}
            </div>
          </div>
        </section>

        {error && <section className="dashboard-error">{error}</section>}

        <section className="main-balance-grid">
          <div className="main-balance-card capital-card">
            <span>Capital Balance</span>

            <h2>{formatMoney(account.capitalBalance)}</h2>

            <p>This increases whenever you Compound Profit.</p>
          </div>

          <div className="main-balance-card profit-card">
            <span>Profit Balance</span>

            <h2>{formatMoney(account.profitBalance)}</h2>

            <p>Available for Profit Withdrawal or Compound Profit.</p>
          </div>

          <div className="main-balance-card referral-card">
            <span>Referral Balance</span>

            <h2>{formatReferralMoney(referral?.referralBalance)}</h2>

            <p>Available for Referral Withdrawal or Compound Referral.</p>
          </div>
        </section>

        <section className="bank-actions-card">
          <div className="bank-actions-header">
            <div>
              <span className="bank-label">Actions</span>
              <h3>Manage AutoPilot Balance</h3>
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={() => setActiveAction("withdraw")}
              disabled={actionLoading}
            >
              Profit Withdrawal
            </button>

            <button
              onClick={() => setActiveAction("compound")}
              disabled={actionLoading}
            >
              Compound Profit
            </button>

            <button
              onClick={() => setActiveAction("withdraw-referral")}
              disabled={
                actionLoading || Number(referral?.referralBalance || 0) <= 0
              }
            >
              Referral Withdrawal
            </button>

            <button
              onClick={() => setActiveAction("compound-referral")}
              disabled={
                actionLoading || Number(referral?.referralBalance || 0) <= 0
              }
            >
              Compound Referral
            </button>

            <button
              disabled={!canWithdrawCapital || actionLoading}
              onClick={handleWithdrawCapital}
            >
              {canWithdrawCapital
                ? "Capital Withdrawal"
                : `Capital Locked • ${capitalDaysLeft} days`}
            </button>
          </div>

          {activeAction && (
            <div className="amount-panel">
              <div>
                <h4>
                  {activeAction === "withdraw"
                    ? "Profit Withdrawal"
                    : activeAction === "compound"
                      ? "Compound Profit"
                      : activeAction === "withdraw-referral"
                        ? "Referral Withdrawal"
                        : "Compound Referral"}
                </h4>

                <p>
                  {activeAction === "withdraw" ||
                  activeAction === "compound" ? (
                    <>
                      Profit Balance:{" "}
                      <strong>{formatMoney(account.profitBalance)}</strong>
                    </>
                  ) : (
                    <>
                      Referral Balance:{" "}
                      <strong>
                        {formatReferralMoney(referral?.referralBalance)}
                      </strong>
                    </>
                  )}
                </p>
              </div>

              {activeAction === "withdraw" && (
                <div className="withdrawal-account-box">
                  <div className="withdrawal-account-header">
                    <span>Payout Details</span>

                    <button onClick={() => navigate("/payout-details")}>
                      {payoutDetails ? "Update Payout Details" : "Add Details"}
                    </button>
                  </div>

                  {payoutDetails ? (
                    <div className="withdrawal-account-details">
                      <div>
                        <small>Account Name</small>
                        <strong>{payoutDetails.accountName}</strong>
                      </div>

                      <div>
                        <small>Bank</small>
                        <strong>{payoutDetails.bankName}</strong>
                      </div>

                      <div>
                        <small>Account Number</small>
                        <strong>{payoutDetails.accountNumber}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="missing-account-box">
                      <p>No payout details have been added yet.</p>

                      <button onClick={() => navigate("/payout-details")}>
                        Add Payout Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              <input
                type="number"
                placeholder={`Enter amount in ${
                  activeAction === "withdraw" || activeAction === "compound"
                    ? currency
                    : referralCurrency
                }`}
                value={amount}
                min="1"
                max={
                  activeAction === "withdraw" || activeAction === "compound"
                    ? account.profitBalance
                    : referral?.referralBalance
                }
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="amount-actions">
                <button
                  onClick={
                    activeAction === "withdraw"
                      ? handleWithdrawProfit
                      : activeAction === "compound"
                        ? handleCompoundProfit
                        : activeAction === "withdraw-referral"
                          ? handleWithdrawReferral
                          : handleCompoundReferral
                  }
                  disabled={
                    actionLoading ||
                    (activeAction === "withdraw" && !payoutDetails) ||
                    (activeAction === "withdraw-referral" && !payoutDetails)
                  }
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>

                <button
                  className="cancel-btn"
                  onClick={resetAction}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="history-card">
          <div className="history-header">
            <div>
              <span className="bank-label">History</span>
              <h3>Account Activity</h3>
            </div>
          </div>

          <div className="history-filters">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="package_activation">Package Activation</option>
              <option value="profit_credit">Profit Credit</option>
              <option value="profit_withdrawal">Profit Withdrawal</option>
              <option value="profit_reinvest">Compound Profit</option>
              <option value="capital_withdrawal">Capital Withdrawal</option>
              <option value="payout_successful">Payout Successful</option>
              <option value="payout_failed">Payout Failed</option>
              <option value="referral_compound">Compound Referral</option>
              <option value="referral_withdrawal">Referral Withdrawal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <button
              className="clear-filter-btn"
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
                setDateFilter("");
              }}
            >
              Clear
            </button>
          </div>

          <div className="history-table">
            <div className="history-table-head">
              <span>Type</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date & Time</span>
            </div>

            {history.length > 0 ? (
              history.map((item) => (
                <div className="history-table-row" key={item._id}>
                  <span>{formatType(item.type)}</span>

                  <strong>{formatMoney(item.amount)}</strong>

                  <b className={`status-badge ${item.status}`}>{item.status}</b>

                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="empty-history">No matching history found.</div>
            )}
          </div>
        </section>

        <div
          className="autopilot-guide-link"
          onClick={() => navigate("/autopilot-guide")}
        >
          Not sure how AutoPilot works? Read the complete AutoPilot Guide. New
          to AutoPilot? Click here to understand how the Rebetas AutoPilot AI
          system works, including profits, compounding, referrals and
          withdrawals →
        </div>

        <button
          className="autopilot-guide-button"
          onClick={() => navigate("/autopilot-guide")}
        >
          Understand AutoPilot
        </button>
      </main>

      <Footer />
    </div>
  );
}
