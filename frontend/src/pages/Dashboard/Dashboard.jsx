import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";

import Footer from "../../components/Footer/Footer";
import api from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import { getImageUrl } from "../../utils/getImageUrl";

export default function Dashboard() {
  const user = getStoredUser();
  const navigate = useNavigate();

  const [subscriptionData, setSubscriptionData] = useState({
    active: false,
    subscription: null,
  });

  const [platforms, setPlatforms] = useState([]);

  /* ---------------- LOAD SUBSCRIPTION ---------------- */

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await api.get("/subscriptions/status");

        setSubscriptionData(res?.data ?? res);
      } catch (error) {
        console.error("Subscription load error:", error);

        setSubscriptionData({
          active: false,
          subscription: null,
        });
      }
    }

    loadSubscription();
  }, []);

  /* ---------------- LOAD PLATFORMS ---------------- */

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const res = await api.get("/platforms");

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        // ✅ show all platforms (dashboard is interactive page → optional filter later)
        setPlatforms(data);
      } catch (err) {
        console.error("Failed to load platforms:", err);
      }
    }

    loadPlatforms();
  }, []);

  /* ---------------- SUBSCRIPTION LOGIC ---------------- */

  const subscription = subscriptionData?.active
    ? subscriptionData.subscription
    : null;

  const expiryDate = subscription?.endDate
    ? new Date(subscription.endDate)
    : null;

  const today = new Date();

  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)))
    : 0;

  /* ---------------- UI ---------------- */

  return (
    <div className="dashboard-page">
      <DashboardNavbar />

      <div className="container dashboard-container">
        {/* PLAN INDICATOR */}
        <div className="plan-indicator">
          <div className="plan-indicator-left">
            <span className="plan-dot"></span>

            <span className="plan-text">
              {subscription
                ? `${subscription.plan.toUpperCase()} PLAN ACTIVE`
                : "NO ACTIVE PLAN"}
            </span>
          </div>

          <div className="plan-indicator-right">
            {subscription
              ? `Expires in ${daysRemaining} days • ${new Date(
                  subscription.endDate,
                ).toLocaleDateString()}`
              : "No active subscription"}
          </div>
        </div>

        {/* NO SUB */}
        {!subscription && (
          <div className="subscribe-banner">
            <p>You don’t have an active subscription.</p>

            <button
              className="subscribe-btn"
              onClick={() => navigate("/pricing")}
            >
              Subscribe Now
            </button>
          </div>
        )}

        {/* ACCOUNT */}
        <div className="account-card">
          <div className="account-header">
            <div className="account-info">
              <span className="dashboard-tag">ACCOUNT</span>

              <h2>Welcome, {user?.fullName || "User"}</h2>

              <div className="plan-details">
                <p>
                  <strong>Plan:</strong>{" "}
                  {subscription ? subscription.plan.toUpperCase() : "NONE"}
                </p>

                <p>
                  <strong>Status:</strong>
                  <span
                    className={`plan-status ${
                      subscription ? "active" : "expired"
                    }`}
                  >
                    {subscription ? "Active" : "Inactive"}
                  </span>
                </p>

                <p>
                  <strong>Expires:</strong>{" "}
                  {subscription
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <Link to="/account" className="profile-icon">
              <span>👤</span>
            </Link>
          </div>
        </div>

        {/* PLATFORMS */}
        <div className="platform-section">
          <span className="dashboard-tag">PLATFORMS</span>

          <h2>Select Betting Platform</h2>

          <div className="platform-grid">
            {platforms.map((platform) => (
              <div
                key={platform._id}
                className="platform-card"
                onClick={() => navigate(`/prediction/${platform._id}`)}
              >
                {platform.logo ? (
                  <img
                    src={getImageUrl(platform.logo)}
                    alt={platform.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="platform-placeholder">{platform.name}</div>
                )}

                <span>{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
