import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import "./Investments.css";

const packages = [
  { id: "starter", name: "Starter", amount: 60000, tag: "Entry Package" },
  { id: "bronze", name: "Bronze", amount: 150000, tag: "Growth Package" },
  { id: "silver", name: "Silver", amount: 300000, tag: "Advanced Package" },
  { id: "gold", name: "Gold", amount: 500000, tag: "Premium Package" },
  { id: "diamond", name: "Diamond", amount: 1000000, tag: "Elite Package" },
];

export default function Investments() {
  const [selectedPackage, setSelectedPackage] = useState(null);

  const formatMoney = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

  const handleContinue = () => {
    if (!selectedPackage) {
      alert("Please select an AutoPilot package");
      return;
    }

    console.log({
      package: selectedPackage,
      provider: "flutterwave",
    });

    alert(
      "Flutterwave payment connection will be added after backend is ready.",
    );
  };

  return (
    <div className="investment-page">
      <DashboardNavbar />

      <main className="investment-container">
        <section className="investment-hero">
          <span className="investment-tag">Rebetas AutoPilot</span>

          <h1>Daily growth without the stress of manual play</h1>

          <p>
            Activate AutoPilot and allow Rebetas to handle the daily activity
            for you, while you monitor your profit, withdrawals, and growth in
            real time.
          </p>

          <div className="hero-highlights">
            <span>Rebetas does the work</span>
            <span>Withdraw profit daily</span>
            <span>Compound anytime</span>
          </div>
        </section>

        <section className="investment-note">
          <strong>You stay in control:</strong> your daily profit can be
          withdrawn anytime or compounded to grow your active capital.
        </section>

        <section className="package-grid">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              className={`package-card ${
                selectedPackage?.id === pkg.id ? "selected" : ""
              }`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <div className="package-card-header">
                <span>{pkg.tag}</span>
                <strong>{pkg.name}</strong>
              </div>

              <div className="package-amount">{formatMoney(pkg.amount)}</div>

              <div className="package-divider" />

              <ul>
                <li>Rebetas handles the daily activity for you</li>
                <li>Daily profit updates on your dashboard</li>
                <li>Withdraw profit whenever you want</li>
                <li>Compound profit to grow your active capital</li>
              </ul>

              <div className="select-package-text">
                {selectedPackage?.id === pkg.id ? "Selected" : "Select Package"}
              </div>
            </button>
          ))}
        </section>

        <section className="checkout-panel">
          <div>
            <span className="panel-label">Activation</span>
            <h3>Complete AutoPilot Setup</h3>
            <p>Your payment will be processed securely through Flutterwave.</p>
          </div>

          <div className="selected-summary">
            <span>Selected package</span>
            <strong>
              {selectedPackage
                ? `${selectedPackage.name} • ${formatMoney(
                    selectedPackage.amount,
                  )}`
                : "No package selected"}
            </strong>
          </div>

          <button className="continue-investment-btn" onClick={handleContinue}>
            Continue to Secure Payment
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
