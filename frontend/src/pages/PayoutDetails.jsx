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

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // GET BANKS
        const bankRes = await api.get("/payout-details/banks?country=NG");
        setBanks(bankRes || []);

        // GET USER DETAILS
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
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ================= VERIFY ================= */
  async function verifyAccount(accountNumber, bankCode) {
    if (accountNumber.length !== 10 || !bankCode) return;

    try {
      setVerifying(true);
      setError("");

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
      setError("Invalid account details");
    } finally {
      setVerifying(false);
    }
  }

  /* ================= FORM ================= */
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "accountNumber" || name === "bankCode") {
      verifyAccount(
        name === "accountNumber" ? value : form.accountNumber,
        name === "bankCode" ? value : form.bankCode,
      );
    }
  }

  /* ================= BANK SELECT ================= */
  function handleBankChange(e) {
    const code = e.target.value;
    const bank = banks.find((b) => b.code === code);

    setForm((prev) => ({
      ...prev,
      bankCode: code,
      bankName: bank?.name || "",
      accountName: "", // reset
    }));
    verifyAccount(form.accountNumber, code);
  }

  /* ================= SAVE ================= */
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/payout-details/my", form);

      setSuccess("Payment details saved successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="payout-details-page">
      <DashboardNavbar />

      <div className="container payout-details-container">
        <h1>Payment Details</h1>

        <div className="payout-details-card">
          <form onSubmit={handleSubmit} className="payout-details-form">
            {/* BANK SELECT */}
            <select value={form.bankCode} onChange={handleBankChange} required>
              <option value="">Select Bank</option>
              {banks.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* ACCOUNT NUMBER */}
            <input
              name="accountNumber"
              placeholder="Account Number"
              value={form.accountNumber}
              onChange={handleChange}
              required
            />

            {/* ACCOUNT NAME (AUTO) */}
            <input
              name="accountName"
              placeholder="Account Name"
              value={form.accountName}
              readOnly
            />

            <button type="submit" disabled={saving || verifying}>
              {saving ? "Saving..." : "Save Details"}
            </button>

            {verifying && <p>Verifying account...</p>}
          </form>

          {error && <p className="payout-error">{error}</p>}
          {success && <p className="payout-success">{success}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}
