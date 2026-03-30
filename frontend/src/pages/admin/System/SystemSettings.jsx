import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ ADDED
import {
  getSettings,
  updateSettings,
  resetCapital,
} from "../../../services/adminApi";
import "./SystemSettings.css";

const defaultSettings = {
  capital: "",
  baseStakePercent: "",
  multiplier: "",
  bettingSimulationActive: false,
};

export default function SystemSettings() {
  const navigate = useNavigate(); // ✅ ADDED

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const res = await getSettings();

      // ✅ SAFE OBJECT HANDLING
      if (res && typeof res === "object") {
        setSettings({
          ...defaultSettings,
          ...res,
        });
      } else {
        console.warn("Unexpected settings response:", res);
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load settings");
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUpdate(e) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      await updateSettings({
        capital: Number(settings.capital) || 0,
        baseStakePercent: Number(settings.baseStakePercent) || 0,
        multiplier: Number(settings.multiplier) || 0,
        bettingSimulationActive: settings.bettingSimulationActive,
      });

      setSuccess("Settings updated successfully");
    } catch (err) {
      console.error(err);
      setError("Update failed");
    }
  }

  async function handleResetCapital() {
    if (!window.confirm("Reset capital?")) return;

    try {
      await resetCapital({
        capital: Number(settings.capital) || 0,
      });

      setSuccess("Capital reset successfully");
    } catch (err) {
      console.error(err);
      setError("Reset failed");
    }
  }

  return (
    <div className="system-page">
      {/* ✅ UPDATED HEADER (SAFE ADDITION) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>System Settings</h2>

        <button
          type="button"
          onClick={() => navigate("/admin/settings/withdrawals")}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Withdrawal Settings ⚙️
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form className="system-form" onSubmit={handleUpdate}>
          <input
            name="capital"
            type="number"
            placeholder="Capital"
            value={settings.capital || ""}
            onChange={handleChange}
          />

          <input
            name="baseStakePercent"
            type="number"
            placeholder="Base Stake %"
            value={settings.baseStakePercent || ""}
            onChange={handleChange}
          />

          <input
            name="multiplier"
            type="number"
            placeholder="Multiplier"
            value={settings.multiplier || ""}
            onChange={handleChange}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              name="bettingSimulationActive"
              checked={!!settings.bettingSimulationActive}
              onChange={handleChange}
            />
            Enable Simulation
          </label>

          <button type="submit">Update Settings</button>

          <button
            type="button"
            className="reset-btn"
            onClick={handleResetCapital}
          >
            Reset Capital
          </button>
        </form>
      )}
    </div>
  );
}
