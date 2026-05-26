import { useCallback, useEffect, useState } from "react";
import {
  deleteCurrencyRate,
  getCurrencyRates,
  saveCurrencyRate,
  updateCurrencyRateStatus,
} from "../../../services/adminApi";
import "./AdminCurrencyRates.css";

export default function AdminCurrencyRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    baseCurrency: "",
    targetCurrency: "",
    isActive: "",
  });

  const [form, setForm] = useState({
    baseCurrency: "USD",
    targetCurrency: "",
    rate: "",
    isActive: true,
  });

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getCurrencyRates(filters);
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

    if (!form.baseCurrency || !form.targetCurrency || !form.rate) {
      setError("Base currency, target currency and rate are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await saveCurrencyRate({
        baseCurrency: form.baseCurrency,
        targetCurrency: form.targetCurrency,
        rate: Number(form.rate),
        isActive: form.isActive,
      });

      setSuccess("Currency rate saved successfully.");

      setForm({
        baseCurrency: "USD",
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
    if (!window.confirm("Delete this currency rate?")) {
      return;
    }

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
      [name]: value,
    }));
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value.toUpperCase(),
    }));
  }

  return (
    <div className="admin-currency-page">
      <div className="currency-header">
        <div>
          <h2>🌍 Currency Rates</h2>
          <p>
            Manage admin-controlled exchange rates for AutoPilot Package
            localization and payments.
          </p>
        </div>

        <button onClick={loadRates}>Refresh</button>
      </div>

      {error && <div className="currency-alert error">{error}</div>}
      {success && <div className="currency-alert success">{success}</div>}

      <form className="currency-form-card" onSubmit={handleSave}>
        <h3>Add / Update Rate</h3>

        <div className="currency-form-grid">
          <div>
            <label>Base Currency</label>
            <input
              name="baseCurrency"
              value={form.baseCurrency}
              onChange={handleFormChange}
              placeholder="USD"
            />
          </div>

          <div>
            <label>Target Currency</label>
            <input
              name="targetCurrency"
              value={form.targetCurrency}
              onChange={handleFormChange}
              placeholder="NGN"
            />
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
        <input
          name="baseCurrency"
          value={filters.baseCurrency}
          onChange={handleFilterChange}
          placeholder="Filter base e.g USD"
        />

        <input
          name="targetCurrency"
          value={filters.targetCurrency}
          onChange={handleFilterChange}
          placeholder="Filter target e.g NGN"
        />

        <select
          name="isActive"
          value={filters.isActive}
          onChange={handleFilterChange}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button onClick={loadRates}>Apply Filters</button>

        <button
          className="clear-btn"
          onClick={() =>
            setFilters({
              baseCurrency: "",
              targetCurrency: "",
              isActive: "",
            })
          }
        >
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
                        <button
                          onClick={() =>
                            setForm({
                              baseCurrency: rate.baseCurrency,
                              targetCurrency: rate.targetCurrency,
                              rate: rate.rate,
                              isActive: rate.isActive,
                            })
                          }
                        >
                          Edit
                        </button>

                        <button onClick={() => handleToggleStatus(rate)}>
                          {rate.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
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
