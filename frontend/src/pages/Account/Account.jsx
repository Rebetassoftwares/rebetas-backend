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

  const [hasPromo, setHasPromo] = useState(false);
  const [autoPilotAccount, setAutoPilotAccount] = useState(null);
  const [loadingAutoPilot, setLoadingAutoPilot] = useState(true);
  const [referralData, setReferralData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, autoPilotRes, referralRes] = await Promise.all([
          api.get("/subscriptions/status"),
          api.get("/investments/my"),
          api.get("/user/referral"),
        ]);

        setSubscriptionData(subRes);
        setAutoPilotAccount(autoPilotRes?.data || null);
        setReferralData(referralRes?.data || null);

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
      } finally {
        setLoadingAutoPilot(false);
      }
    }

    loadData();
  }, []);

  function copyToClipboard(value) {
    if (!value) return;

    navigator.clipboard
      .writeText(value)
      .catch((error) => console.error("Copy failed:", error));
  }

  const subscription = subscriptionData.subscription;
  const isActive = subscriptionData.active;
  const hasAutoPilot = !!autoPilotAccount;

  const referralCode = referralData?.referralCode || null;
  const referralLink = referralData?.referralLink || null;

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

            <div className="info-row">
              <span>Currency</span>
              <span>{user?.currency || "-"}</span>
            </div>
          </div>
        </div>

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
                  onClick={() => navigate("/pricing")}
                >
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </div>

        {referralCode && (
          <div className="account-card referral-card-pro">
            <div className="referral-card-header">
              <div>
                <span className="referral-kicker">Referral Program</span>
                <h3>Invite friends and earn from AutoPilot</h3>
                <p>
                  Share your referral link. Every user gets a referral link and
                  referral code. When someone joins Rebetas through you and
                  activates AutoPilot, you earn 10% of every daily profit
                  credited to that user.
                </p>
              </div>
            </div>

            <div className="referral-grid">
              <div className="referral-item">
                <span>Referral Code</span>

                <div className="referral-value-box">
                  <strong>{referralCode}</strong>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="referral-item referral-link-item">
                <span>Referral Link</span>

                <div className="referral-value-box">
                  <strong>{referralLink}</strong>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(referralLink)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="account-card">
          <h3>Rebetas AutoPilot</h3>

          <p>
            Let Rebetas AutoPilot AI handle the daily virtual football betting
            activities for you while you monitor your Capital Balance, Profit
            Balance, withdrawals, and Compound Profit.
          </p>

          {loadingAutoPilot ? (
            <p>Checking AutoPilot account...</p>
          ) : (
            <button
              className="promo-btn"
              onClick={() =>
                navigate(
                  hasAutoPilot ? "/investment-dashboard" : "/investments",
                )
              }
            >
              {hasAutoPilot ? "Open AutoPilot Dashboard" : "Start AutoPilot"}
            </button>
          )}
        </div>

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
