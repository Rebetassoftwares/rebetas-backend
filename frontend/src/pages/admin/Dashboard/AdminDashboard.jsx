import { useEffect, useState } from "react";
import { fetchDashboard } from "../../../services/adminApi";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activeSubscriptions: 0,
    revenue: 0,
    promoEarnings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetchDashboard();

      // ✅ SAFE RESPONSE HANDLING (like pricing screen)
      const data = res?.data || res || {};

      setStats({
        users: data.users || 0,
        activeSubscriptions: data.activeSubscriptions || 0,
        revenue: data.revenue || 0,
        promoEarnings: data.promoEarnings || 0,
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      if (err.response) {
        setError(err.response.data?.message || "Server error");
      } else if (err.request) {
        setError("No response from server");
      } else {
        setError("Request failed");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="admin-dashboard">
      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading dashboard...</div>
      ) : (
        <>
          {/* STATS */}
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span>Total Users</span>
              <h2>{stats.users}</h2>
            </div>

            <div className="dashboard-card">
              <span>Active Subscriptions</span>
              <h2>{stats.activeSubscriptions}</h2>
            </div>

            <div className="dashboard-card">
              <span>Total Revenue</span>
              <h2>₦ {(stats.revenue || 0).toLocaleString()}</h2>
            </div>

            <div className="dashboard-card">
              <span>Promo Earnings</span>
              <h2>₦ {(stats.promoEarnings || 0).toLocaleString()}</h2>
            </div>
          </div>

          {/* INFO */}
          <div className="dashboard-info">
            <div className="info-card">
              <h3>System Overview</h3>
              <p>
                This dashboard reflects real-time platform performance, user
                growth, and monetization metrics.
              </p>
            </div>

            <div className="info-card">
              <h3>Admin Actions</h3>
              <p>
                Use the sidebar to manage pricing, promo codes, users,
                subscriptions and system settings.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
