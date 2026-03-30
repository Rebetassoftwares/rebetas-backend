import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../../services/adminApi";
import "./WithdrawalSettings.css";

export default function WithdrawalSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currencies, setCurrencies] = useState(["NGN", "USD", "KES", "GHS"]);

  const [form, setForm] = useState({
    minWithdrawal: {},
    withdrawalFee: {},
  });

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await getSettings();

        setForm({
          minWithdrawal: res?.minWithdrawal || {},
          withdrawalFee: res?.withdrawalFee || {},
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ================= HANDLE CHANGE ================= */
  function handleChange(type, currency, value) {
    setForm((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [currency]: Number(value),
      },
    }));
  }

  /* ================= ADD NEW CURRENCY ================= */
  function addCurrency() {
    const code = prompt("Enter currency code (e.g. EUR)");

    if (!code) return;

    const upper = code.toUpperCase();

    if (currencies.includes(upper)) return;

    setCurrencies((prev) => [...prev, upper]);
  }

  /* ================= SAVE ================= */
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateSettings({
        minWithdrawal: form.minWithdrawal,
        withdrawalFee: form.withdrawalFee,
      });

      setSuccess("Settings updated successfully");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="withdrawal-settings-page">
      <h1>Withdrawal Settings</h1>

      <form onSubmit={handleSubmit} className="settings-card">
        {/* HEADER */}
        <div className="settings-header">
          <h2>Per Currency Configuration</h2>
          <button type="button" onClick={addCurrency}>
            + Add Currency
          </button>
        </div>

        {/* TABLE */}
        <div className="settings-table">
          <div className="settings-row header">
            <span>Currency</span>
            <span>Min Withdrawal</span>
            <span>Withdrawal Fee</span>
          </div>

          {currencies.map((currency) => (
            <div key={currency} className="settings-row">
              <span>{currency}</span>

              <input
                type="number"
                value={form.minWithdrawal[currency] || ""}
                placeholder="Min"
                onChange={(e) =>
                  handleChange("minWithdrawal", currency, e.target.value)
                }
              />

              <input
                type="number"
                value={form.withdrawalFee[currency] || ""}
                placeholder="Fee"
                onChange={(e) =>
                  handleChange("withdrawalFee", currency, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="settings-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* FEEDBACK */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>
    </div>
  );
}
