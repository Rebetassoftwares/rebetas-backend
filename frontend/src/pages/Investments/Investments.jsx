import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Investments.css";

export default function Investments() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const formatMoney = (amount, currency) => {
    return `${currency || ""} ${Number(amount || 0).toLocaleString()}`;
  };

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/investments/packages");

        const data = Array.isArray(res?.data) ? res.data : [];

        setPackages(data.filter((pkg) => pkg.isActive !== false));
      } catch (err) {
        console.error("AutoPilot Packages error:", err);

        setError(err.message || "Failed to load AutoPilot Packages.");
      } finally {
        setLoading(false);
      }
    }

    loadPackages();
  }, []);

  async function handleContinue() {
    if (!selectedPackage) {
      alert("Please select an AutoPilot Package");
      return;
    }

    try {
      setPaying(true);
      setError("");

      const res = await api.post("/investments/deposit/init", {
        packageId: selectedPackage._id,
      });

      const paymentLink = res?.data?.paymentLink;

      if (!paymentLink) {
        throw new Error("Payment link was not returned.");
      }

      window.location.href = paymentLink;
    } catch (err) {
      console.error("AutoPilot payment init error:", err);

      setError(err.message || "Failed to start AutoPilot payment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="investment-page">
      <DashboardNavbar />

      <main className="investment-container">
        <section className="investment-hero">
          <span className="investment-tag">Rebetas AutoPilot</span>

          <h1>Daily profit without stress</h1>

          <p>
            Activate AutoPilot and let Rebetas handle the daily activity for
            you. You can monitor your Capital Balance, Profit Balance,
            withdrawals, and Compound Profit anytime.
          </p>

          <div className="hero-highlights">
            <span>Rebetas does the work</span>
            <span>Withdraw profit daily</span>
            <span>Compound anytime</span>
          </div>
        </section>

        <section className="investment-note">
          <strong>You stay in control:</strong> your Profit Balance can be
          withdrawn anytime or compounded to increase your Capital Balance.
        </section>

        {error && <section className="investment-error">{error}</section>}

        {loading ? (
          <section className="investment-loading">
            Loading AutoPilot Packages...
          </section>
        ) : packages.length === 0 ? (
          <section className="investment-loading">
            No AutoPilot Packages available now.
          </section>
        ) : (
          <section className="package-grid">
            {packages.map((pkg) => (
              <button
                key={pkg._id}
                className={`package-card ${
                  selectedPackage?._id === pkg._id ? "selected" : ""
                }`}
                onClick={() => setSelectedPackage(pkg)}
                type="button"
              >
                <div className="package-card-header">
                  <span>{pkg.description || "AutoPilot Package"}</span>
                  <strong>{pkg.name}</strong>
                </div>

                <div className="package-amount">
                  {formatMoney(pkg.amount, pkg.currency)}
                </div>

                <div className="daily-return-pill">
                  Daily Profit Credit: {pkg.dailyReturnPercentage}%
                </div>

                <div className="package-divider" />

                <ul>
                  {Array.isArray(pkg.benefits) && pkg.benefits.length > 0 ? (
                    pkg.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))
                  ) : (
                    <>
                      <li>Rebetas handles the daily activity for you</li>
                      <li>Daily Profit Credit updates on your dashboard</li>
                      <li>Withdraw Profit whenever you want</li>
                      <li>Compound Profit to increase Capital Balance</li>
                    </>
                  )}
                </ul>

                <div className="select-package-text">
                  {selectedPackage?._id === pkg._id
                    ? "Selected"
                    : "Select Package"}
                </div>
              </button>
            ))}
          </section>
        )}

        <section className="checkout-panel">
          <div>
            <span className="panel-label">Activation</span>

            <h3>Complete AutoPilot Setup</h3>

            <p>Your payment will be processed securely through Flutterwave.</p>
          </div>

          <div className="selected-summary">
            <span>Selected Package</span>

            <strong>
              {selectedPackage
                ? `${selectedPackage.name} • ${formatMoney(
                    selectedPackage.amount,
                    selectedPackage.currency,
                  )}`
                : "No Package selected"}
            </strong>
          </div>

          <button
            className="continue-investment-btn"
            onClick={handleContinue}
            disabled={paying || !selectedPackage}
          >
            {paying
              ? "Opening Secure Payment..."
              : "Continue to Secure Payment"}
          </button>
        </section>

        <section className="autopilot-guide-preview">
          <div className="guide-preview-header">
            <h2>How AutoPilot Works</h2>

            <p>
              Activate a package, earn daily profits, compound your earnings,
              and build your Capital Balance over time.
            </p>
          </div>

          <div className="guide-preview-grid">
            <div className="guide-preview-card">
              <h3>Daily Profit Credits</h3>

              <p>
                Every package has its own daily profit rate. Profits are
                credited daily into your Profit Balance.
              </p>
            </div>

            <div className="guide-preview-card">
              <h3>Compound & Grow</h3>

              <p>
                Instead of withdrawing profits, you can add them back into your
                Capital Balance to increase future profit calculations.
              </p>
            </div>

            <div className="guide-preview-card">
              <h3>Earn Referral Commissions</h3>

              <p>
                Earn 10% of the daily profits credited to users who joined
                through your referral link or referral code.
              </p>
            </div>

            <div className="guide-preview-card">
              <h3>Withdraw When Needed</h3>

              <p>
                Withdraw Profit Balance anytime. Capital Withdrawal becomes
                available 30 days after your most recent compounding activity.
              </p>
            </div>
          </div>

          <a href="/autopilot-guide" className="autopilot-guide-btn">
            Read Full AutoPilot Guide
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
