import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./InvestmentDashboard.css";

const historyData = [
  {
    id: 1,
    type: "profit_credit",
    label: "Profit Credit",
    amount: 15000,
    status: "successful",
    date: "2026-05-25",
    time: "09:30 AM",
  },
  {
    id: 2,
    type: "profit_reinvest",
    label: "Profit Reinvest",
    amount: 25000,
    status: "successful",
    date: "2026-05-24",
    time: "04:12 PM",
  },
  {
    id: 3,
    type: "profit_withdrawal",
    label: "Profit Withdrawal",
    amount: 10000,
    status: "pending",
    date: "2026-05-23",
    time: "11:05 AM",
  },
  {
    id: 4,
    type: "capital_withdrawal",
    label: "Capital Withdrawal",
    amount: 500000,
    status: "failed",
    date: "2026-05-21",
    time: "02:40 PM",
  },
];

export default function InvestmentDashboard() {
  const navigate = useNavigate();

  const [account, setAccount] = useState({
    packageName: "Gold",
    packageAmount: 500000,
    status: "Active",
    capitalBalance: 575000,
    profitBalance: 45000,
    lastReinvestDate: "2026-05-10",
  });

  const [payoutDetails, setPayoutDetails] = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(true);

  const [activeAction, setActiveAction] = useState(null);
  const [amount, setAmount] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    async function loadPayoutDetails() {
      try {
        const res = await api.get("/payout-details/my");
        setPayoutDetails(res || null);
      } catch (error) {
        console.error("Payout details error:", error);
        setPayoutDetails(null);
      } finally {
        setLoadingPayout(false);
      }
    }

    loadPayoutDetails();
  }, []);

  const formatMoney = (value) => `₦${Number(value).toLocaleString("en-NG")}`;

  const daysSinceLastReinvest = Math.floor(
    (new Date() - new Date(account.lastReinvestDate)) / (1000 * 60 * 60 * 24),
  );

  const capitalDaysLeft = Math.max(0, 30 - daysSinceLastReinvest);
  const canWithdrawCapital = capitalDaysLeft === 0;

  const filteredHistory = useMemo(() => {
    return historyData.filter((item) => {
      const typeMatch = typeFilter === "all" || item.type === typeFilter;
      const statusMatch =
        statusFilter === "all" || item.status === statusFilter;
      const dateMatch = !dateFilter || item.date === dateFilter;

      return typeMatch && statusMatch && dateMatch;
    });
  }, [typeFilter, statusFilter, dateFilter]);

  const resetAction = () => {
    setActiveAction(null);
    setAmount("");
  };

  const validateAmount = () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      alert("Enter a valid amount");
      return null;
    }

    if (value > account.profitBalance) {
      alert("Amount cannot be greater than your current profit balance");
      return null;
    }

    return value;
  };

  const handleWithdrawProfit = () => {
    if (!payoutDetails) {
      alert("Please add your payment details before withdrawing.");
      navigate("/payout-details");
      return;
    }

    const value = validateAmount();
    if (!value) return;

    setAccount((prev) => ({
      ...prev,
      profitBalance: prev.profitBalance - value,
    }));

    resetAction();
  };

  const handleReinvestProfit = () => {
    const value = validateAmount();
    if (!value) return;

    setAccount((prev) => ({
      ...prev,
      profitBalance: prev.profitBalance - value,
      capitalBalance: prev.capitalBalance + value,
      lastReinvestDate: new Date().toISOString().slice(0, 10),
    }));

    resetAction();
  };

  return (
    <div className="auto-dashboard-page">
      <DashboardNavbar />

      <main className="auto-dashboard-container">
        <section className="account-overview">
          <div className="overview-left">
            <span className="bank-label">Rebetas AutoPilot</span>

            <h1>{account.packageName} Package</h1>

            <p>{account.status} account</p>

            <div className="account-owner-box">
              <span>Account Owner</span>

              <strong>John Doe</strong>

              <small>johndoe@email.com</small>

              <div className="owner-package-amount">
                <label>Original Package</label>
                <h3>{formatMoney(account.packageAmount)}</h3>
              </div>
            </div>
          </div>

          <div className="account-overview-actions">
            <div className="account-status-pill">
              {canWithdrawCapital
                ? "Capital withdrawal available"
                : `Capital available in ${capitalDaysLeft} days`}
            </div>

            <button
              type="button"
              className="upgrade-package-btn"
              onClick={() => navigate("/investments")}
            >
              Upgrade Package
            </button>
          </div>
        </section>

        <section className="main-balance-grid">
          <div className="main-balance-card capital-card">
            <span>Capital Balance</span>
            <h2>{formatMoney(account.capitalBalance)}</h2>
            <p>This increases whenever you compound your profit.</p>
          </div>

          <div className="main-balance-card profit-card">
            <span>Current Profit Balance</span>
            <h2>{formatMoney(account.profitBalance)}</h2>
            <p>Available for withdrawal or compounding.</p>
          </div>
        </section>

        <section className="bank-actions-card">
          <div className="bank-actions-header">
            <div>
              <span className="bank-label">Actions</span>
              <h3>Manage Balance</h3>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => setActiveAction("withdraw")}>
              Withdraw Profit
            </button>

            <button onClick={() => setActiveAction("reinvest")}>
              Compound Profit
            </button>

            <button disabled={!canWithdrawCapital}>
              {canWithdrawCapital
                ? "Withdraw Capital"
                : `Capital Locked • ${capitalDaysLeft} days`}
            </button>
          </div>

          {activeAction && (
            <div className="amount-panel">
              <div>
                <h4>
                  {activeAction === "withdraw"
                    ? "Withdraw Profit"
                    : "Compound Profit"}
                </h4>

                <p>
                  Current profit balance:{" "}
                  <strong>{formatMoney(account.profitBalance)}</strong>
                </p>
              </div>

              {activeAction === "withdraw" && (
                <div className="withdrawal-account-box">
                  <div className="withdrawal-account-header">
                    <span>Withdrawal Account</span>

                    <button onClick={() => navigate("/payout-details")}>
                      {payoutDetails ? "Update Payout Details" : "Add Details"}
                    </button>
                  </div>

                  {loadingPayout ? (
                    <p className="account-muted">Loading payment details...</p>
                  ) : payoutDetails ? (
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
                      <p>No payment account has been added yet.</p>
                      <button onClick={() => navigate("/payout-details")}>
                        Add Payment Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                min="1"
                max={account.profitBalance}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="amount-actions">
                <button
                  onClick={
                    activeAction === "withdraw"
                      ? handleWithdrawProfit
                      : handleReinvestProfit
                  }
                  disabled={activeAction === "withdraw" && !payoutDetails}
                >
                  Confirm
                </button>

                <button className="cancel-btn" onClick={resetAction}>
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
              <option value="profit_credit">Profit Credit</option>
              <option value="profit_withdrawal">Profit Withdrawal</option>
              <option value="profit_reinvest">Profit Reinvest</option>
              <option value="capital_withdrawal">Capital Withdrawal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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

            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div className="history-table-row" key={item.id}>
                  <span>{item.label}</span>
                  <strong>{formatMoney(item.amount)}</strong>
                  <b className={`status-badge ${item.status}`}>{item.status}</b>
                  <span>
                    {item.date} • {item.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-history">No matching history found.</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
