import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import api from "../../services/api";
import "./AutoPilotPaymentVerify.css";

export default function AutoPilotPaymentVerify() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your AutoPilot payment...");
  const [account, setAccount] = useState(null);

  function formatMoney(value, currency) {
    return `${currency || ""} ${Number(value || 0).toLocaleString()}`;
  }

  useEffect(() => {
    async function verifyPayment() {
      try {
        const params = new URLSearchParams(location.search);

        const txRef =
          params.get("tx_ref") ||
          params.get("reference") ||
          params.get("trxref");

        if (!txRef) {
          setStatus("failed");
          setMessage("Payment reference was not found.");
          return;
        }

        const res = await api.post("/investments/deposit/verify", {
          reference: txRef,
        });

        if (!res?.success) {
          setStatus("failed");
          setMessage(res?.message || "Failed to verify AutoPilot payment.");
          return;
        }

        setAccount(res?.data?.account || null);
        setStatus("successful");
        setMessage("Your AutoPilot Package has been activated successfully.");

        setTimeout(() => {
          navigate("/investment-dashboard");
        }, 4000);
      } catch (err) {
        console.error("Payment verification error:", err);

        setStatus("failed");
        setMessage(err.message || "Failed to verify AutoPilot payment.");
      }
    }

    verifyPayment();
  }, [location.search, navigate]);

  return (
    <div className="verify-page">
      <DashboardNavbar />

      <main className="verify-container">
        <section className="verify-card">
          <div className={`verify-icon ${status}`}>
            {status === "processing"
              ? "⏳"
              : status === "successful"
                ? "✅"
                : "❌"}
          </div>

          <span className="verify-label">Rebetas AutoPilot</span>

          <h1>
            {status === "processing"
              ? "Processing Payment"
              : status === "successful"
                ? "AutoPilot Activated"
                : "Payment Failed"}
          </h1>

          <p>{message}</p>

          {account && (
            <div className="verify-summary">
              <div className="summary-row">
                <span>Package</span>
                <strong>
                  {account.packageNameSnapshot || "AutoPilot Package"}
                </strong>
              </div>

              <div className="summary-row">
                <span>Package Amount</span>
                <strong>
                  {formatMoney(
                    account.packageAmountSnapshot,
                    account.currency || account.userDisplayCurrency,
                  )}
                </strong>
              </div>

              <div className="summary-row">
                <span>Status</span>
                <strong className="success-text">Active</strong>
              </div>
            </div>
          )}

          <div className="verify-actions">
            {status === "successful" ? (
              <button onClick={() => navigate("/investment-dashboard")}>
                Open AutoPilot Dashboard
              </button>
            ) : status === "failed" ? (
              <button onClick={() => navigate("/investments")}>
                Try Again
              </button>
            ) : (
              <button disabled>Verifying Payment...</button>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
