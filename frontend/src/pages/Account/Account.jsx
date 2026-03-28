import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Account.css";
import api from "../../services/api";
import { getStoredUser } from "../../utils/auth";

export default function Account() {
  const user = getStoredUser();
  const navigate = useNavigate();

  const [subscriptionData, setSubscriptionData] = useState({
    active: false,
    subscription: null,
  });

  // ✅ NEW STATE
  const [hasPromo, setHasPromo] = useState(false);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes] = await Promise.all([api.get("/subscriptions/status")]);

        setSubscriptionData(subRes);

        // 🔥 CHECK PROMO
        try {
          await api.get("/promo/my");
          setHasPromo(true);
        } catch {
          setHasPromo(false);
        }
      } catch (error) {
        console.error("Load error:", error);

        setSubscriptionData({
          active: false,
          subscription: null,
        });
      }
    }

    loadData();
  }, []);

  const subscription = subscriptionData.subscription;
  const isActive = subscriptionData.active;

  const supportEmail = "support@rebetas.com";

  const expiryDate = subscription?.endDate
    ? new Date(subscription.endDate)
    : null;
  const today = new Date();

  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="account-page">
      <DashboardNavbar />

      <div className="container account-container">
        <h1 className="account-title">Account Settings</h1>

        <div className="plan-alert">
          {isActive ? (
            <>
              Your plan expires in <strong>{daysRemaining} days</strong>
            </>
          ) : (
            <>You do not have an active plan</>
          )}
        </div>

        {/* PROFILE */}
        <div className="account-card">
          <h3>Profile</h3>

          <div className="account-info">
            <div className="info-row">
              <span>Username</span>
              <span>{user?.username || "-"}</span>
            </div>

            <div className="info-row">
              <span>Full Name</span>
              <span>{user?.fullName || "-"}</span>
            </div>

            <div className="info-row">
              <span>Email</span>
              <span>{user?.email || "-"}</span>
            </div>

            <div className="info-row">
              <span>Phone Number</span>
              <span>{user?.phone || "-"}</span>
            </div>

            <div className="info-row">
              <span>Country</span>
              <span>{user?.country || "-"}</span>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION */}
        <div className="account-card">
          <h3>Subscription</h3>

          <div className="account-info">
            <div className="info-row">
              <span>Plan Type</span>
              <span className="plan-badge">
                {subscription ? subscription.plan.toUpperCase() : "NONE"}
              </span>
            </div>

            <div className="info-row">
              <span>Plan Status</span>
              <span className={isActive ? "active" : ""}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="info-row">
              <span>Plan Expires</span>
              <span>
                {subscription
                  ? new Date(subscription.endDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            {!isActive && (
              <div style={{ marginTop: "15px" }}>
                <button
                  className="subscribe-btn"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ PROMO SECTION (NEW) */}
        {hasPromo && (
          <div className="account-card">
            <h3>Promo Program</h3>

            <p>You are a promo partner. Track your earnings and withdrawals.</p>

            <button
              className="promo-btn"
              onClick={() => navigate("/promo-dashboard")}
            >
              Open Promo Dashboard
            </button>
          </div>
        )}

        {/* SUPPORT */}
        <div className="account-card">
          <h3>Contact Support</h3>

          <div className="support-buttons">
            <a href={`mailto:${supportEmail}`} className="email-btn">
              Contact via Email
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
