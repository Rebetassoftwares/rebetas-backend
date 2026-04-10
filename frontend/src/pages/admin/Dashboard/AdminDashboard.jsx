import { useEffect, useMemo, useState } from "react";
import {
  fetchDashboard,
  autoResolvePredictions,
} from "../../../services/adminApi";
import "./AdminDashboard.css";

const currencyMeta = {
  NGN: { symbol: "₦", label: "Nigerian Naira" },
  USD: { symbol: "$", label: "US Dollar" },
  EUR: { symbol: "€", label: "Euro" },
  GBP: { symbol: "£", label: "British Pound" },
  KES: { symbol: "KSh", label: "Kenyan Shilling" },
  ZAR: { symbol: "R", label: "South African Rand" },
  GHS: { symbol: "GH₵", label: "Ghanaian Cedi" },
};

function formatMoney(currency, amount) {
  const meta = currencyMeta[currency];
  const safeAmount = Number(amount || 0);

  return `${meta?.symbol || currency} ${safeAmount.toLocaleString()}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activeSubscriptions: 0,
    revenue: [],
    promoStats: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetchDashboard();
      const data = res?.data || res || {};

      setStats({
        users: data.users || 0,
        activeSubscriptions: data.activeSubscriptions || 0,
        revenue: Array.isArray(data.revenue) ? data.revenue : [],
        promoStats: Array.isArray(data.promoStats) ? data.promoStats : [],
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      if (err.response) {
        setError(err.response.data?.message || "Server error");
      } else if (err.request) {
        setError("No response from server");
      } else {
        setError(err.message || "Request failed");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAutoResolve() {
    try {
      if (
        !window.confirm(
          "Are you sure you want to resolve all pending predictions?",
        )
      ) {
        return;
      }

      await autoResolvePredictions();

      alert("✅ Predictions resolved successfully");

      loadDashboard(); // refresh stats if needed
    } catch (err) {
      console.error(err);
      alert("❌ Failed to resolve predictions");
    }
  }

  const revenueCurrencies = useMemo(
    () => stats.revenue.length,
    [stats.revenue],
  );
  const promoCurrencies = useMemo(
    () => stats.promoStats.length,
    [stats.promoStats],
  );

  return (
    <div className="admin-dashboard">
      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="dashboard-top-grid">
            <div className="dashboard-hero-card">
              <button onClick={handleAutoResolve} className="resolve-btn">
                Resolve Pending Predictions
              </button>
              <div className="hero-badge">Revenue Analytics</div>
              <h2>Financial overview across all supported currencies</h2>
              <p>
                Monitor subscriptions, promo earnings, and currency distribution
                from one clean admin view.
              </p>

              <div className="hero-stats">
                <div className="hero-stat">
                  <span>Total Users</span>
                  <strong>{stats.users.toLocaleString()}</strong>
                </div>

                <div className="hero-stat">
                  <span>Active Subscriptions</span>
                  <strong>{stats.activeSubscriptions.toLocaleString()}</strong>
                </div>

                <div className="hero-stat">
                  <span>Revenue Currencies</span>
                  <strong>{revenueCurrencies}</strong>
                </div>

                <div className="hero-stat">
                  <span>Promo Currencies</span>
                  <strong>{promoCurrencies}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="card-header">
                <div>
                  <h3>Total Revenue</h3>
                  <p>Separated by subscription currency</p>
                </div>
              </div>

              {stats.revenue.length > 0 ? (
                <div className="currency-list">
                  {stats.revenue.map((item, index) => (
                    <div
                      className="currency-row"
                      key={`${item.currency || item._id}-${index}`}
                    >
                      <div className="currency-left">
                        <span className="currency-code">
                          {item.currency || item._id}
                        </span>
                        <small>
                          {currencyMeta[item.currency || item._id]?.label ||
                            "Supported currency"}
                        </small>
                      </div>

                      <div className="currency-right revenue">
                        {formatMoney(
                          item.currency || item._id,
                          item.total || 0,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No revenue data available yet.
                </div>
              )}
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <div>
                  <h3>Promo Earnings</h3>
                  <p>Separated by wallet currency</p>
                </div>
              </div>

              {stats.promoStats.length > 0 ? (
                <div className="currency-list">
                  {stats.promoStats.map((item, index) => (
                    <div
                      className="currency-row"
                      key={`${item.currency || item._id}-${index}`}
                    >
                      <div className="currency-left">
                        <span className="currency-code">
                          {item.currency || item._id}
                        </span>
                        <small>
                          {currencyMeta[item.currency || item._id]?.label ||
                            "Supported currency"}
                        </small>
                      </div>

                      <div className="currency-right promo">
                        <div>
                          Total: {formatMoney(item.currency, item.totalEarned)}
                        </div>
                        <div>
                          Balance: {formatMoney(item.currency, item.balance)}
                        </div>
                        <div>
                          Pending: {formatMoney(item.currency, item.pending)}
                        </div>
                        <div>
                          Withdrawn:{" "}
                          {formatMoney(item.currency, item.withdrawn)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No promo earnings recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="bottom-info-grid">
            <div className="info-card">
              <h3>System Overview</h3>
              <p>
                This dashboard reflects real subscription activity and financial
                performance without incorrectly merging different currencies
                into one figure.
              </p>
            </div>

            <div className="info-card">
              <h3>Admin Actions</h3>
              <p>
                Use the sidebar to manage pricing, promo codes, users,
                subscriptions, platforms, prediction settings, and future
                reporting modules.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
