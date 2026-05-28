import { useCallback, useEffect, useState } from "react";
import COUNTRIES from "../../../data/countries";
import {
  deleteCurrencyRate,
  getCurrencyRates,
  saveCurrencyRate,
  updateCurrencyRateStatus,
} from "../../../services/adminApi";
import "./AdminCurrencyRates.css";

const BASE_CURRENCY = "USD";

const currencyOptions = Array.from(
  new Map(
    COUNTRIES.map((country) => [
      country.currency,
      {
        currency: country.currency,
        country: country.name,
      },
    ]),
  ).values(),
).sort((a, b) => a.currency.localeCompare(b.currency));

export default function AdminCurrencyRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    targetCurrency: "",
    isActive: "",
  });

  const [form, setForm] = useState({
    targetCurrency: "",
    rate: "",
    isActive: true,
  });

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getCurrencyRates({
        baseCurrency: BASE_CURRENCY,
        ...filters,
      });

      setRates(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Currency rates error:", err);
      setError(err.message || "Failed to load currency rates.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  async function handleSave(e) {
    e.preventDefault();

    const targetCurrency = String(form.targetCurrency || "")
      .trim()
      .toUpperCase();

    const numericRate = Number(form.rate);

    if (!targetCurrency || !numericRate || numericRate <= 0) {
      setError("Target currency and a valid rate are required.");
      return;
    }

    if (targetCurrency === BASE_CURRENCY) {
      setError("Target currency cannot be the same as USD.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await saveCurrencyRate({
        baseCurrency: BASE_CURRENCY,
        targetCurrency,
        rate: numericRate,
        isActive: form.isActive,
      });

      setSuccess("Currency rate saved successfully.");

      setForm({
        targetCurrency: "",
        rate: "",
        isActive: true,
      });

      await loadRates();
    } catch (err) {
      console.error("Save currency rate error:", err);
      setError(err.message || "Failed to save currency rate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(rate) {
    try {
      setError("");
      setSuccess("");

      await updateCurrencyRateStatus(rate._id, !rate.isActive);

      setSuccess(
        !rate.isActive
          ? "Currency rate activated successfully."
          : "Currency rate deactivated successfully.",
      );

      await loadRates();
    } catch (err) {
      console.error("Update currency rate status error:", err);
      setError(err.message || "Failed to update currency rate status.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this currency rate?")) return;

    try {
      setError("");
      setSuccess("");

      await deleteCurrencyRate(id);

      setSuccess("Currency rate deleted successfully.");

      await loadRates();
    } catch (err) {
      console.error("Delete currency rate error:", err);
      setError(err.message || "Failed to delete currency rate.");
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: name === "targetCurrency" ? value.toUpperCase() : value,
    }));
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value.toUpperCase(),
    }));
  }

  function handleEdit(rate) {
    setForm({
      targetCurrency: rate.targetCurrency || "",
      rate: rate.rate || "",
      isActive: rate.isActive !== false,
    });

    setError("");
    setSuccess("");
  }

  function clearFilters() {
    setFilters({
      targetCurrency: "",
      isActive: "",
    });
  }

  return (
    <div className="admin-currency-page">
      <div className="currency-header">
        <div>
          <h2>🌍 Currency Rates</h2>
          <p>
            Manage USD exchange rates used for AutoPilot Package localization,
            balances and payments.
          </p>
        </div>

        <button type="button" onClick={loadRates} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="currency-alert error">{error}</div>}
      {success && <div className="currency-alert success">{success}</div>}

      <form className="currency-form-card" onSubmit={handleSave}>
        <h3>Add / Update Rate</h3>

        <div className="currency-form-grid">
          <div>
            <label>Base Currency</label>
            <input value={BASE_CURRENCY} readOnly />
          </div>

          <div>
            <label>Target Currency</label>

            <select
              name="targetCurrency"
              value={form.targetCurrency}
              onChange={handleFormChange}
            >
              <option value="">Select Currency</option>

              {currencyOptions.map((item) => (
                <option key={item.currency} value={item.currency}>
                  {item.currency} — {item.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Rate</label>
            <input
              type="number"
              name="rate"
              value={form.rate}
              min="0.000001"
              step="0.000001"
              onChange={handleFormChange}
              placeholder="1500"
            />
          </div>

          <label className="currency-checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleFormChange}
            />
            Active
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Currency Rate"}
        </button>
      </form>

      <div className="currency-filter-card">
        <input value={BASE_CURRENCY} readOnly />

        <select
          name="targetCurrency"
          value={filters.targetCurrency}
          onChange={handleFilterChange}
        >
          <option value="">All Currencies</option>

          {currencyOptions.map((item) => (
            <option key={item.currency} value={item.currency}>
              {item.currency} — {item.country}
            </option>
          ))}
        </select>

        <select
          name="isActive"
          value={filters.isActive}
          onChange={handleFilterChange}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button type="button" onClick={loadRates}>
          Apply Filters
        </button>

        <button type="button" className="clear-btn" onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div className="currency-table-card">
        <h3>Configured Rates</h3>

        {loading ? (
          <div className="currency-empty">Loading currency rates...</div>
        ) : rates.length === 0 ? (
          <div className="currency-empty">No currency rates found.</div>
        ) : (
          <div className="currency-table-wrapper">
            <table className="currency-table">
              <thead>
                <tr>
                  <th>Base</th>
                  <th>Target</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Updated By</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rates.map((rate) => (
                  <tr key={rate._id}>
                    <td>{rate.baseCurrency}</td>
                    <td>{rate.targetCurrency}</td>
                    <td>{Number(rate.rate || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`currency-status ${
                          rate.isActive ? "active" : "inactive"
                        }`}
                      >
                        {rate.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {rate.updatedBy?.fullName ||
                        rate.updatedBy?.username ||
                        "—"}
                    </td>
                    <td>
                      {rate.updatedAt
                        ? new Date(rate.updatedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <div className="currency-actions">
                        <button type="button" onClick={() => handleEdit(rate)}>
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(rate)}
                        >
                          {rate.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(rate._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
