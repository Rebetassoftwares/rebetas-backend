import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSettings,
  updateSettings,
  resetCapital,
  getLeagueCapitals,
  resetAllLeagueCapitals,
} from "../../../services/adminApi";

import "./SystemSettings.css";

const defaultSettings = {
  capital: "",
  baseStakePercent: "",
  multiplier: "",
  bettingSimulationActive: false,
};

export default function SystemSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(defaultSettings);
  const [leagues, setLeagues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ---------------- LOAD SYSTEM SETTINGS ---------------- */
  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const res = await getSettings();

      if (res && typeof res === "object") {
        setSettings({
          ...defaultSettings,
          ...res,
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- LOAD LEAGUE CAPITALS ---------------- */
  async function loadLeagueCapitals() {
    try {
      const res = await getLeagueCapitals();
      setLeagues(res || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadSettings();
    loadLeagueCapitals();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* ---------------- UPDATE SYSTEM SETTINGS ---------------- */
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

  /* ---------------- RESET SYSTEM CAPITAL ---------------- */
  async function handleResetCapital() {
    if (!window.confirm("Reset system capital?")) return;

    try {
      await resetCapital({
        capital: Number(settings.capital) || 0,
      });

      setSuccess("System capital reset successfully");
    } catch (err) {
      console.error(err);
      setError("Reset failed");
    }
  }

  /* ---------------- RESET ALL LEAGUE CAPITALS ---------------- */
  async function handleResetAllLeagues() {
    if (!window.confirm("Reset ALL league capitals?")) return;

    try {
      await resetAllLeagueCapitals({
        capital: Number(settings.capital) || 0,
      });

      await loadLeagueCapitals();

      setSuccess("All league capitals reset successfully");
    } catch (err) {
      console.error(err);
      setError("League reset failed");
    }
  }

  return (
    <div className="system-page">
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
        <>
          {/* ---------------- SYSTEM SETTINGS FORM ---------------- */}
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
              Reset System Capital
            </button>
          </form>

          {/* ---------------- LEAGUE CAPITALS SECTION ---------------- */}
          <div style={{ marginTop: "40px" }}>
            <h3>League Capitals</h3>

            <button
              type="button"
              onClick={handleResetAllLeagues}
              style={{
                marginBottom: "15px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Reset All League Capitals
            </button>

            <div className="league-capitals">
              {leagues.length === 0 ? (
                <p>No leagues found</p>
              ) : (
                leagues.map((l) => (
                  <div key={l.id} className="league-capital-card">
                    <strong>
                      {l.platform} - {l.leagueName}
                    </strong>
                    <div>Capital: {l.capital}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
