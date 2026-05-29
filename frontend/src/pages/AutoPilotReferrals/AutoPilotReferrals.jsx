import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./AutoPilotReferrals.css";

export default function AutoPilotReferrals() {
  const [summary, setSummary] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function formatMoney(value, currency = "") {
    return `${currency || ""} ${Number(value || 0).toLocaleString()}`;
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  }

  useEffect(() => {
    async function loadReferrals() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/investments/referrals");
        const data = res?.data || {};

        setSummary(data.summary || null);
        setReferrals(
          Array.isArray(data.enrichedReferrals)
            ? data.enrichedReferrals
            : Array.isArray(data.referrals)
              ? data.referrals
              : [],
        );
        setBonuses(Array.isArray(data.bonuses) ? data.bonuses : []);
      } catch (err) {
        console.error("AutoPilot referrals error:", err);
        setError(err.message || "Failed to load AutoPilot referrals.");
      } finally {
        setLoading(false);
      }
    }

    loadReferrals();
  }, []);

  return (
    <div className="autopilot-referrals-page">
      <DashboardNavbar />

      <main className="autopilot-referrals-container">
        <section className="referrals-hero">
          <span className="referrals-kicker">AutoPilot Referrals</span>

          <h1>Your Referral Network</h1>

          <p>
            Track users who joined Rebetas through your referral link or code,
            their AutoPilot status, package details, Capital Balance, and
            referral earnings generated for you.
          </p>
        </section>

        {error && <section className="referrals-error">{error}</section>}

        {loading ? (
          <section className="referrals-loading">
            Loading AutoPilot referrals...
          </section>
        ) : (
          <>
            <section className="referrals-summary-grid">
              <div className="referrals-summary-card">
                <span>Total Referrals</span>
                <h2>{summary?.totalReferrals || 0}</h2>
                <p>Users registered through your referral link or code.</p>
              </div>

              <div className="referrals-summary-card active-card">
                <span>Active AutoPilot Referrals</span>
                <h2>{summary?.activeAutoPilotReferrals || 0}</h2>
                <p>Referrals currently using AutoPilot.</p>
              </div>

              <div className="referrals-summary-card earnings-card">
                <span>Total Referral Earnings</span>
                <h2>
                  {formatMoney(
                    summary?.totalReferralEarnings || 0,
                    bonuses?.[0]?.currency || "",
                  )}
                </h2>
                <p>Total credited referral earnings from AutoPilot profits.</p>
              </div>
            </section>

            <section className="referrals-card">
              <div className="referrals-card-header">
                <div>
                  <span className="referrals-kicker">Referral List</span>
                  <h3>People You Referred</h3>
                </div>
              </div>

              {referrals.length === 0 ? (
                <div className="empty-referrals">No referrals found yet.</div>
              ) : (
                <div className="referrals-table">
                  <div className="referrals-table-head">
                    <span>User</span>
                    <span>Package</span>
                    <span>Capital Balance</span>
                    <span>Daily Profit</span>
                    <span>Your 10%</span>
                    <span>Status</span>
                  </div>

                  {referrals.map((item) => {
                    const user = item.referredUser || {};
                    const autopilot = item.autopilot || null;
                    const earnings = item.referralEarnings || {};
                    const currency =
                      autopilot?.currency ||
                      user?.currency ||
                      bonuses?.[0]?.currency ||
                      "";

                    return (
                      <div className="referrals-table-row" key={item._id}>
                        <div>
                          <strong>
                            {user.fullName || user.username || "User"}
                          </strong>
                          <small>
                            @{user.username || "user"} • Joined{" "}
                            {formatDate(item.createdAt || user.createdAt)}
                          </small>
                        </div>

                        <span>
                          {autopilot?.packageName || "No active package"}
                        </span>

                        <span>
                          {autopilot
                            ? formatMoney(autopilot.capitalBalance, currency)
                            : "—"}
                        </span>

                        <span>
                          {autopilot
                            ? formatMoney(
                                autopilot.estimatedDailyProfit,
                                currency,
                              )
                            : "—"}
                        </span>

                        <span>
                          {autopilot
                            ? formatMoney(
                                autopilot.estimatedReferralCommission,
                                currency,
                              )
                            : formatMoney(
                                earnings.latestCommission || 0,
                                currency,
                              )}
                        </span>

                        <b
                          className={`referral-status ${
                            autopilot?.status || item.status || "inactive"
                          }`}
                        >
                          {autopilot?.status || item.status || "inactive"}
                        </b>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="referrals-card">
              <div className="referrals-card-header">
                <div>
                  <span className="referrals-kicker">Recent Earnings</span>
                  <h3>Latest Referral Bonuses</h3>
                </div>
              </div>

              {bonuses.length === 0 ? (
                <div className="empty-referrals">
                  No referral bonuses credited yet.
                </div>
              ) : (
                <div className="bonus-list">
                  {bonuses.map((bonus) => (
                    <div className="bonus-item" key={bonus._id}>
                      <div>
                        <strong>
                          {bonus.referredUser?.fullName ||
                            bonus.referredUser?.username ||
                            "Referral"}
                        </strong>
                        <small>{formatDate(bonus.createdAt)}</small>
                      </div>

                      <span>{formatMoney(bonus.amount, bonus.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
