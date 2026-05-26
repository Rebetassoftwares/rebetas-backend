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
      setError(err.message || "Failed to load promo dashboard");
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
    return <div className="promo-loading">Loading promo dashboard...</div>;
  }

  if (error) {
    return <div className="promo-error">{error}</div>;
  }

  if (!data) return null;

  const promo = data?.promo || {};
  const wallets = data?.wallets || [];
  const earnings = data?.earnings || [];

  const totalEarned = wallets.reduce(
    (sum, w) => sum + Number(w.totalEarned || 0),
    0,
  );
  const totalBalance = wallets.reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0,
  );
  const totalPending = wallets.reduce(
    (sum, w) => sum + Number(w.pendingBalance || 0),
    0,
  );

  return (
    <div className="promo-dashboard">
      <div className="promo-container">
        <section className="promo-hero">
          <div>
            <span className="promo-label">Rebetas Partner Program</span>
            <h1>Promo Dashboard</h1>
            <p>
              Track your promo code performance, wallet balances, earnings, and
              withdrawals.
            </p>
          </div>

          <div className="promo-hero-actions">
            <span className="promo-code">{promo.code || "NO CODE"}</span>

            <button
              className="payout-btn"
              onClick={() => navigate("/payout-details")}
            >
              Payout Details
            </button>
          </div>
        </section>

        <section className="promo-info-box">
          <div>
            <span className="promo-label">Promo Details</span>
            <h3>{promo.code || "-"}</h3>
          </div>

          <div className="promo-info-grid">
            <div>
              <span>Commission</span>
              <strong>{promo.commissionPercent || 0}%</strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>{promo.discountPercent || 0}%</strong>
            </div>

            <div>
              <span>Free Time</span>
              <strong>
                {promo.freeDays || 0}d / {promo.freeWeeks || 0}w
              </strong>
            </div>

            <div>
              <span>Max Uses Per User</span>
              <strong>{promo.maxUsesPerUser || 1}</strong>
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <p>Total Earned</p>
            <h2>{totalEarned.toLocaleString()}</h2>
          </div>

          <div className="summary-card">
            <p>Available Balance</p>
            <h2>{totalBalance.toLocaleString()}</h2>
          </div>

          <div className="summary-card">
            <p>Pending Withdrawals</p>
            <h2>{totalPending.toLocaleString()}</h2>
          </div>

          <div className="summary-card">
            <p>Commission Rate</p>
            <h2>{promo.commissionPercent || 0}%</h2>
          </div>
        </section>

        <section className="promo-section">
          <div className="section-header">
            <span className="promo-label">Wallets</span>
            <h2>Available Wallets</h2>
          </div>

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
                    <strong>
                      {Number(wallet.balance || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <p>Pending</p>
                    <strong>
                      {Number(wallet.pendingBalance || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="wallet-footer">
                  <button
                    disabled={wallet.balance <= 0 || wallet.pendingBalance > 0}
                    onClick={() => openWithdraw(wallet)}
                  >
                    Withdraw
                  </button>

                  {wallet.pendingBalance > 0 && (
                    <p className="warning">
                      You already have a pending withdrawal
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="promo-section">
          <div className="section-header">
            <span className="promo-label">History</span>
            <h2>Earnings History</h2>
          </div>

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
                  {earnings.map((earning) => (
                    <tr key={earning._id}>
                      <td>{earning.subscribedUserId?.username || "-"}</td>
                      <td>
                        {Number(earning.commissionAmount || 0).toLocaleString()}
                      </td>
                      <td>{earning.currency}</td>
                      <td>
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <WithdrawalModal
        isOpen={showWithdraw}
        wallet={selectedWallet}
        onClose={() => setShowWithdraw(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
