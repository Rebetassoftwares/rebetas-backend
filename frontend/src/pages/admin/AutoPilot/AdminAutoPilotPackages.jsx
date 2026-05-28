import { useEffect, useState } from "react";
import {
  getAutoPilotPackages,
  createAutoPilotPackage,
  updateAutoPilotPackage,
  activateAutoPilotPackage,
  deactivateAutoPilotPackage,
} from "../../../services/adminApi";
import "./AdminAutoPilotPackages.css";

const PACKAGE_CURRENCY = "USD";

const initialForm = {
  name: "",
  amount: "",
  dailyReturnPercentage: "",
  benefits: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminAutoPilotPackages() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPackages() {
    try {
      setLoading(true);
      setError("");

      const res = await getAutoPilotPackages();

      setPackages(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Load AutoPilot Packages error:", err);
      setError(err.message || "Failed to load AutoPilot Packages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  }

  function handleEdit(item) {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      amount: item.amount ?? "",
      dailyReturnPercentage: item.dailyReturnPercentage ?? "",
      benefits: Array.isArray(item.benefits) ? item.benefits.join("\n") : "",
      description: item.description || "",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== false,
    });
  }

  function validateForm() {
    const amount = Number(form.amount);
    const dailyReturnPercentage = Number(form.dailyReturnPercentage);
    const sortOrder = Number(form.sortOrder || 0);

    if (!form.name.trim()) {
      return "Package name is required";
    }

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return "Valid USD Package amount is required";
    }

    if (
      dailyReturnPercentage === null ||
      Number.isNaN(dailyReturnPercentage) ||
      dailyReturnPercentage < 0
    ) {
      return "Valid Daily Profit Credit percentage is required";
    }

    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      return "Sort order must be a valid number";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        amount: Number(form.amount),
        currency: PACKAGE_CURRENCY,
        dailyReturnPercentage: Number(form.dailyReturnPercentage),
        benefits: form.benefits
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
      };

      if (editingId) {
        await updateAutoPilotPackage(editingId, payload);
      } else {
        await createAutoPilotPackage(payload);
      }

      resetForm();
      await loadPackages();
    } catch (err) {
      console.error("Save AutoPilot Package error:", err);
      setError(err.message || "Failed to save AutoPilot Package");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id) {
    if (!window.confirm("Activate this AutoPilot Package?")) return;

    try {
      setError("");
      await activateAutoPilotPackage(id);
      await loadPackages();
    } catch (err) {
      console.error("Activate AutoPilot Package error:", err);
      setError(err.message || "Failed to activate AutoPilot Package");
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Deactivate this AutoPilot Package?")) return;

    try {
      setError("");
      await deactivateAutoPilotPackage(id);
      await loadPackages();
    } catch (err) {
      console.error("Deactivate AutoPilot Package error:", err);
      setError(err.message || "Failed to deactivate AutoPilot Package");
    }
  }

  function formatAmount(value) {
    return `${PACKAGE_CURRENCY} ${Number(value || 0).toLocaleString()}`;
  }

  return (
    <div className="autopilot-packages-page">
      <div className="autopilot-packages-header">
        <div>
          <h2>📦 AutoPilot Packages</h2>
          <p>Create and manage USD Packages users can activate.</p>
        </div>

        <button type="button" onClick={loadPackages} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="autopilot-packages-error">{error}</div>}

      <form className="autopilot-package-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Package Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="Package Amount in USD"
          value={form.amount}
          onChange={handleChange}
          required
        />

        <div className="package-currency-field">
          <span>Package Currency</span>
          <strong>{PACKAGE_CURRENCY}</strong>
        </div>

        <input
          name="dailyReturnPercentage"
          type="number"
          min="0"
          step="0.01"
          placeholder="Daily Profit Credit %"
          value={form.dailyReturnPercentage}
          onChange={handleChange}
          required
        />

        <input
          name="sortOrder"
          type="number"
          min="0"
          placeholder="Sort Order"
          value={form.sortOrder}
          onChange={handleChange}
        />

        <label className="package-checkbox">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
          />
          Active Package
        </label>

        <textarea
          name="benefits"
          placeholder="Benefits, one per line"
          value={form.benefits}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Package description"
          value={form.description}
          onChange={handleChange}
        />

        <div className="package-form-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update Package"
                : "Create Package"}
          </button>

          {editingId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="packages-loading">Loading Packages...</div>
      ) : packages.length === 0 ? (
        <div className="packages-loading">No AutoPilot Packages yet.</div>
      ) : (
        <div className="packages-grid">
          {packages.map((item) => (
            <div key={item._id} className="package-card">
              <div className="package-card-top">
                <div>
                  <h3>{item.name}</h3>
                  <p>{formatAmount(item.amount)}</p>
                </div>

                <span
                  className={`package-status ${
                    item.isActive ? "active" : "inactive"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="package-meta">
                <div>
                  <span>Daily Profit Credit</span>
                  <strong>{Number(item.dailyReturnPercentage || 0)}%</strong>
                </div>

                <div>
                  <span>Sort Order</span>
                  <strong>{item.sortOrder || 0}</strong>
                </div>
              </div>

              {item.description && (
                <p className="package-description">{item.description}</p>
              )}

              {Array.isArray(item.benefits) && item.benefits.length > 0 && (
                <ul className="package-benefits">
                  {item.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              )}

              <div className="package-actions">
                <button type="button" onClick={() => handleEdit(item)}>
                  Edit
                </button>

                {item.isActive ? (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => handleDeactivate(item._id)}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    className="success-btn"
                    onClick={() => handleActivate(item._id)}
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
