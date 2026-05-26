import { useEffect, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar/DashboardNavbar";
import Footer from "../components/Footer/Footer";
import api from "../services/api";
import "./PayoutDetails.css";

export default function PayoutDetails() {
  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    bankCode: "",
  });

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const userCountry = "NG";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const bankRes = await api.get(
          `/payout-details/banks?country=${userCountry}`,
        );

        const sortedBanks = (bankRes || []).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setBanks(sortedBanks);

        const payoutRes = await api.get("/payout-details/my");

        if (payoutRes) {
          setForm({
            accountName: payoutRes.accountName || "",
            accountNumber: payoutRes.accountNumber || "",
            bankName: payoutRes.bankName || "",
            bankCode: payoutRes.bankCode || "",
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function verifyAccount(accountNumber, bankCode) {
    if (accountNumber.length !== 10 || !bankCode) return;

    try {
      setVerifying(true);
      setError("");
      setSuccess("");

      const res = await api.post("/payout-details/verify-account", {
        accountNumber,
        bankCode,
      });

      setForm((prev) => ({
        ...prev,
        accountName: res.account_name,
      }));
    } catch (err) {
      console.error(err);
      setError(
        "Invalid account details. Please confirm your bank and account number.",
      );
      setForm((prev) => ({
        ...prev,
        accountName: "",
      }));
    } finally {
      setVerifying(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const cleanValue =
      name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setForm((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));

    if (name === "accountNumber") {
      verifyAccount(cleanValue, form.bankCode);
    }
  }

  function handleBankChange(e) {
    const code = e.target.value;
    const bank = banks.find((b) => b.code === code);

    setForm((prev) => ({
      ...prev,
      bankCode: code,
      bankName: bank?.name || "",
      accountName: "",
    }));

    verifyAccount(form.accountNumber, code);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.bankCode || !form.accountNumber || !form.accountName) {
      setError("Please select your bank and verify your account number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/payout-details/my", form);

      setSuccess("Payout details saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save payout details");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="payout-details-page">
        <DashboardNavbar />
        <div className="payout-details-container">
          <div className="payout-loading-card">Loading payout details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="payout-details-page">
      <DashboardNavbar />

      <main className="payout-details-container">
        <section className="payout-hero">
          <span>Rebetas Payout Account</span>
          <h1>Manage your withdrawal account</h1>
          <p>
            Add or update the bank account where your AutoPilot and promo
            withdrawals will be paid.
          </p>
        </section>

        <section className="payout-layout">
          <div className="payout-details-card">
            <div className="payout-card-header">
              <div>
                <span>Bank Information</span>
                <h2>Payout Details</h2>
              </div>

              <div
                className={form.accountName ? "verified-pill" : "pending-pill"}
              >
                {form.accountName ? "Verified" : "Not Verified"}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="payout-details-form">
              <div className="form-group">
                <label>Bank</label>
                <select
                  value={form.bankCode}
                  onChange={handleBankChange}
                  required
                >
                  <option value="">Select your bank</option>
                  {banks.map((bank) => (
                    <option key={bank.id || bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  name="accountNumber"
                  placeholder="Enter 10-digit account number"
                  value={form.accountNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Name</label>
                <input
                  name="accountName"
                  placeholder={
                    verifying
                      ? "Verifying account..."
                      : "Account name appears here"
                  }
                  value={form.accountName}
                  readOnly
                />
              </div>

              {verifying && (
                <p className="payout-info">Verifying account details...</p>
              )}

              {error && <p className="payout-error">{error}</p>}
              {success && <p className="payout-success">{success}</p>}

              <button type="submit" disabled={saving || verifying}>
                {saving ? "Saving..." : "Save Payout Details"}
              </button>
            </form>
          </div>

          <aside className="payout-preview-card">
            <span>Account Preview</span>

            <div className="preview-bank-card">
              <small>Withdrawal Account</small>
              <h3>{form.accountName || "Not verified yet"}</h3>

              <div className="preview-row">
                <p>Bank</p>
                <strong>{form.bankName || "-"}</strong>
              </div>

              <div className="preview-row">
                <p>Account Number</p>
                <strong>{form.accountNumber || "-"}</strong>
              </div>
            </div>

            <p className="preview-note">
              This account will be shown for confirmation anytime you request a
              withdrawal from your dashboard.
            </p>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
