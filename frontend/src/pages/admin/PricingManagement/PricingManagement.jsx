import { useEffect, useState } from "react";
import {
  getPricing,
  createPricing,
  updatePricing,
  deletePricing,
} from "../../../services/adminApi";
import "./PricingManagement.css";

export default function PricingManagement() {
  const [pricing, setPricing] = useState([]);
  const [countries, setCountries] = useState([]);

  const [form, setForm] = useState({
    country: "",
    currency: "",
    weeklyPrice: "",
    monthlyPrice: "",
    yearlyPrice: "",
    isDefault: false,
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- FETCH COUNTRIES ---------------- */

  async function loadCountries() {
    try {
      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,currencies",
      );

      const data = await res.json();

      const formatted = data
        .map((c) => {
          const currencyCode = c.currencies
            ? Object.keys(c.currencies)[0]
            : null;

          if (!currencyCode) return null;

          return {
            name: c.name.common,
            currency: currencyCode,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      setCountries(formatted);
    } catch (err) {
      console.error("Country fetch failed:", err);
    }
  }

  /* ---------------- LOAD PRICING ---------------- */

  async function loadPricing() {
    try {
      setLoading(true);

      const res = await getPricing();
      const data = Array.isArray(res) ? res : res?.data || [];

      setPricing(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pricing");
      setPricing([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPricing();
    loadCountries();
  }, []);

  /* ---------------- HANDLE CHANGE ---------------- */

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    // COUNTRY SELECT → AUTO CURRENCY
    if (name === "country") {
      const selected = countries.find((c) => c.name === value);

      setForm((prev) => ({
        ...prev,
        country: value,
        currency: selected?.currency || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* ---------------- SUBMIT ---------------- */

  async function handleSubmit(e) {
    e.preventDefault();

    // 🚫 PREVENT DUPLICATE COUNTRY
    const exists = pricing.find(
      (p) => p.country === form.country && p._id !== editingId,
    );

    if (exists) {
      setError("Pricing already exists for this country");
      return;
    }

    try {
      if (editingId) {
        await updatePricing(editingId, form);
      } else {
        await createPricing(form);
      }

      // RESET
      setForm({
        country: "",
        currency: "",
        weeklyPrice: "",
        monthlyPrice: "",
        yearlyPrice: "",
        isDefault: false,
      });

      setEditingId(null);
      loadPricing();
    } catch (err) {
      console.error(err);
      setError("Action failed");
    }
  }

  /* ---------------- EDIT ---------------- */

  function handleEdit(item) {
    setForm({
      country: item.country || "",
      currency: item.currency || "",
      weeklyPrice: item.weeklyPrice || "",
      monthlyPrice: item.monthlyPrice || "",
      yearlyPrice: item.yearlyPrice || "",
      isDefault: item.isDefault || false,
    });

    setEditingId(item._id);
  }

  /* ---------------- DELETE ---------------- */

  async function handleDelete(id) {
    if (!window.confirm("Delete this pricing?")) return;

    try {
      await deletePricing(id);
      loadPricing();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="pricing-page">
      <h2>Country Pricing</h2>

      {error && <div className="admin-error">{error}</div>}

      {/* -------- FORM -------- */}
      <form className="pricing-form" onSubmit={handleSubmit}>
        {/* COUNTRY SELECT */}
        <select
          name="country"
          value={form.country}
          onChange={handleChange}
          required
        >
          <option value="">Select Country</option>

          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* AUTO CURRENCY */}
        <input
          name="currency"
          value={form.currency}
          placeholder="Currency"
          disabled
        />

        <input
          name="weeklyPrice"
          type="number"
          placeholder="Weekly Price"
          value={form.weeklyPrice}
          onChange={handleChange}
          required
        />

        <input
          name="monthlyPrice"
          type="number"
          placeholder="Monthly Price"
          value={form.monthlyPrice}
          onChange={handleChange}
          required
        />

        <input
          name="yearlyPrice"
          type="number"
          placeholder="Yearly Price"
          value={form.yearlyPrice}
          onChange={handleChange}
          required
        />

        <label className="checkbox">
          <input
            type="checkbox"
            name="isDefault"
            checked={form.isDefault}
            onChange={handleChange}
          />
          Set as Default
        </label>

        <button type="submit">
          {editingId ? "Update Pricing" : "Create Pricing"}
        </button>
      </form>

      {/* -------- TABLE -------- */}
      {loading ? (
        <p>Loading...</p>
      ) : pricing.length === 0 ? (
        <p>No pricing data available</p>
      ) : (
        <div className="pricing-table">
          {pricing.map((item) => (
            <div key={item._id} className="pricing-card">
              <h3>
                {item.country} {item.isDefault && "(Default)"}
              </h3>

              <p>Currency: {item.currency}</p>
              <p>Weekly: {item.weeklyPrice}</p>
              <p>Monthly: {item.monthlyPrice}</p>
              <p>Yearly: {item.yearlyPrice}</p>

              <div className="actions">
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
