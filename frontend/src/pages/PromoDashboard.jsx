import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import WithdrawalModal from "../components/WithdrawalModal";

import "./PromoDashboard.css";

export default function PromoDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      const res = await api.get("/promo/my");

      setData(res?.data || res);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openWithdraw(wallet) {
    setSelectedWallet(wallet);
    setShowWithdraw(true);
  }

  if (loading) {
    return <div className="promo-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="promo-error">{error}</div>;
  }

  if (!data) return null;

  const promo = data?.promo || {};
  const wallets = data?.wallets || [];
  const earnings = data?.earnings || [];

  // SUMMARY
  const totalEarned = wallets.reduce((sum, w) => sum + (w.totalEarned || 0), 0);
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalPending = wallets.reduce(
    (sum, w) => sum + (w.pendingBalance || 0),
    0,
  );

  return (
    <div className="promo-dashboard">
      {/* HEADER */}
      <div className="promo-header">
        <h1>Promo Dashboard</h1>

        <div className="promo-header-right">
          <span className="promo-code">{promo.code}</span>

          <button
            className="payout-btn"
            onClick={() => navigate("/payout-details")}
          >
            Payment Details
          </button>
        </div>
      </div>

      <div className="promo-info-box">
        <h3>Promo Details</h3>

        <p>
          <strong>Code:</strong> {promo.code || "-"}
        </p>

        <p>
          <strong>Commission:</strong> {promo.commissionPercent || 0}%
        </p>

        {/* 🔥 CONDITIONAL BENEFITS */}

        {promo.discountPercent > 0 && (
          <p>
            <strong>Discount:</strong> {promo.discountPercent}%
          </p>
        )}

        {(promo.freeDays > 0 || promo.freeWeeks > 0) && (
          <p>
            <strong>Free Time:</strong> {promo.freeDays || 0} days /{" "}
            {promo.freeWeeks || 0} weeks
          </p>
        )}

        {/* 🔥 NOTHING SET */}

        {promo.discountPercent === 0 &&
          promo.freeDays === 0 &&
          promo.freeWeeks === 0 && <p>No additional benefits configured</p>}

        <p>
          <strong>Max Uses Per User:</strong> {promo.maxUsesPerUser || 1}
        </p>
      </div>

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Earned</p>
          <h2>{totalEarned}</h2>
        </div>

        <div className="summary-card">
          <p>Available Balance</p>
          <h2>{totalBalance}</h2>
        </div>

        <div className="summary-card">
          <p>Pending Withdrawals</p>
          <h2>{totalPending}</h2>
        </div>

        <div className="summary-card">
          <p>Commission</p>
          <h2>{promo.commissionPercent}%</h2>
        </div>

        <div className="summary-card">
          <p>Promo Power</p>

          <h3 style={{ fontSize: "14px", lineHeight: "1.4" }}>
            {promo.discountPercent > 0 && `${promo.discountPercent}% OFF `}
            {(promo.freeDays > 0 || promo.freeWeeks > 0) &&
              `+ ${promo.freeDays || 0}d / ${promo.freeWeeks || 0}w`}
          </h3>
        </div>
        <div className="summary-card">
          <p>Usage Limit</p>
          <h2>{promo.maxUsesPerUser || 1}</h2>
        </div>
      </div>

      {/* WALLETS */}
      <div className="section">
        <h2>Wallets</h2>

        <div className="wallet-grid">
          {wallets.length === 0 && <p className="empty">No wallets yet</p>}

          {wallets.map((wallet) => (
            <div key={wallet.currency} className="wallet-card">
              <div className="wallet-header">
                <h3>{wallet.currency}</h3>
                <span className="badge">Live</span>
              </div>

              <div className="wallet-body">
                <div>
                  <p>Balance</p>
                  <strong>{wallet.balance}</strong>
                </div>

                <div>
                  <p>Pending</p>
                  <strong>{wallet.pendingBalance}</strong>
                </div>
              </div>

              <div className="wallet-footer">
                <button
                  disabled={wallet.balance <= 0}
                  onClick={() => openWithdraw(wallet)}
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EARNINGS */}
      <div className="section">
        <h2>Earnings History</h2>

        {earnings.length === 0 ? (
          <p className="empty">No earnings yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="earnings-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {earnings.map((e) => (
                  <tr key={e._id}>
                    <td>{e.subscribedUserId?.username || "-"}</td>
                    <td>{e.commissionAmount}</td>
                    <td>{e.currency}</td>
                    <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      <WithdrawalModal
        isOpen={showWithdraw}
        wallet={selectedWallet}
        onClose={() => setShowWithdraw(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
