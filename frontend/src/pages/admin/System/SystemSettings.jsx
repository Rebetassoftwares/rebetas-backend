import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSettings,
  updateSettings,
  resetCapital,
  getLeagueCapitals,
  resetAllLeagueCapitals,
  getActivitySettings,
  updateActivitySettings,
} from "../../../services/adminApi";

import "./SystemSettings.css";

const defaultSettings = {
  capital: "",
  baseStakePercent: "",
  multiplier: "",
  bettingSimulationActive: false,
};

const defaultActivitySettings = {
  activityMin: "",
  activityMax: "",
};

export default function SystemSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(defaultSettings);
  const [activitySettings, setActivitySettings] = useState(
    defaultActivitySettings,
  );

  const [leagues, setLeagues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activityError, setActivityError] = useState("");
  const [activitySuccess, setActivitySuccess] = useState("");

  /* ---------------- LOAD GENERAL SYSTEM SETTINGS ---------------- */

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
      console.error("Load system settings error:", err);
      setError("Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- LOAD ACTIVITY SETTINGS ---------------- */

  async function loadActivitySettings() {
    try {
      setActivityLoading(true);
      setActivityError("");

      const res = await getActivitySettings();

      if (res && typeof res === "object") {
        setActivitySettings({
          activityMin: res.activityMin ?? "",
          activityMax: res.activityMax ?? "",
        });
      } else {
        setActivitySettings(defaultActivitySettings);
      }
    } catch (err) {
      console.error("Load activity settings error:", err);
      setActivityError(
        err?.response?.data?.message ||
          "Failed to load website activity settings.",
      );
    } finally {
      setActivityLoading(false);
    }
  }

  /* ---------------- LOAD LEAGUE CAPITALS ---------------- */

  async function loadLeagueCapitals() {
    try {
      const res = await getLeagueCapitals();
      setLeagues(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Load league capitals error:", err);
    }
  }

  useEffect(() => {
    loadSettings();
    loadActivitySettings();
    loadLeagueCapitals();
  }, []);

  /* ---------------- GENERAL SETTINGS INPUT ---------------- */

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* ---------------- ACTIVITY SETTINGS INPUT ---------------- */

  function handleActivityChange(e) {
    const { name, value } = e.target;

    setActivitySettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* ---------------- UPDATE GENERAL SYSTEM SETTINGS ---------------- */

  async function handleUpdate(e) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSavingSettings(true);

      await updateSettings({
        capital: Number(settings.capital) || 0,
        baseStakePercent: Number(settings.baseStakePercent) || 0,
        multiplier: Number(settings.multiplier) || 0,
        bettingSimulationActive: settings.bettingSimulationActive,
      });

      setSuccess("System settings updated successfully.");
      await loadSettings();
    } catch (err) {
      console.error("Update system settings error:", err);

      setError(
        err?.response?.data?.message || "Failed to update system settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  /* ---------------- UPDATE ACTIVITY SETTINGS ---------------- */

  async function handleUpdateActivity(e) {
    e.preventDefault();

    setActivityError("");
    setActivitySuccess("");

    const min = Number(activitySettings.activityMin);
    const max = Number(activitySettings.activityMax);

    if (
      activitySettings.activityMin === "" ||
      activitySettings.activityMax === ""
    ) {
      setActivityError("Please enter both minimum and maximum values.");
      return;
    }

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < min ||
      max > 1000000
    ) {
      setActivityError(
        "Enter valid whole numbers. Minimum must be zero or greater, maximum must be at least the minimum, and maximum cannot exceed 1,000,000.",
      );
      return;
    }

    try {
      setSavingActivity(true);

      await updateActivitySettings({
        activityMin: min,
        activityMax: max,
      });

      setActivitySettings({
        activityMin: min,
        activityMax: max,
      });

      setActivitySuccess(
        "Website activity settings updated successfully. A new activity snapshot has been generated.",
      );
    } catch (err) {
      console.error("Update activity settings error:", err);

      setActivityError(
        err?.response?.data?.message ||
          "Failed to update website activity settings.",
      );
    } finally {
      setSavingActivity(false);
    }
  }

  /* ---------------- RESET SYSTEM CAPITAL ---------------- */

  async function handleResetCapital() {
    if (!window.confirm("Are you sure you want to reset system capital?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await resetCapital({
        capital: Number(settings.capital) || 0,
      });

      setSuccess("System capital reset successfully.");
      await loadSettings();
    } catch (err) {
      console.error("Reset system capital error:", err);

      setError(
        err?.response?.data?.message || "Failed to reset system capital.",
      );
    }
  }

  /* ---------------- RESET ALL LEAGUE CAPITALS ---------------- */

  async function handleResetAllLeagues() {
    if (
      !window.confirm("Are you sure you want to reset ALL league capitals?")
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await resetAllLeagueCapitals({
        capital: Number(settings.capital) || 0,
      });

      await loadLeagueCapitals();

      setSuccess("All league capitals reset successfully.");
    } catch (err) {
      console.error("Reset all league capitals error:", err);

      setError(
        err?.response?.data?.message || "Failed to reset league capitals.",
      );
    }
  }

  return (
    <div className="system-page">
      {/* ---------------- PAGE HEADER ---------------- */}

      <div className="system-page-header">
        <div>
          <h2>System Settings</h2>
          <p>Manage your platform's core operational settings.</p>
        </div>

        <button
          type="button"
          className="withdrawal-settings-btn"
          onClick={() => navigate("/admin/settings/withdrawals")}
        >
          Withdrawal Settings <span aria-hidden="true">⚙️</span>
        </button>
      </div>

      {/* ---------------- GENERAL SYSTEM SETTINGS ---------------- */}

      <section className="settings-section">
        <div className="settings-section-header">
          <div>
            <h3>General System Settings</h3>
            <p>Configure system capital, betting parameters and simulation.</p>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        {loading ? (
          <p className="settings-loading">Loading system settings...</p>
        ) : (
          <form className="system-form" onSubmit={handleUpdate}>
            <div className="settings-field">
              <label htmlFor="system-capital">System Capital</label>
              <input
                id="system-capital"
                name="capital"
                type="number"
                min="0"
                step="any"
                placeholder="Enter system capital"
                value={settings.capital ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="base-stake">Base Stake Percentage</label>
              <input
                id="base-stake"
                name="baseStakePercent"
                type="number"
                min="0"
                step="any"
                placeholder="Enter base stake percentage"
                value={settings.baseStakePercent ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="system-multiplier">Multiplier</label>
              <input
                id="system-multiplier"
                name="multiplier"
                type="number"
                min="1"
                step="any"
                placeholder="Enter multiplier"
                value={settings.multiplier ?? ""}
                onChange={handleChange}
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="bettingSimulationActive"
                checked={!!settings.bettingSimulationActive}
                onChange={handleChange}
              />
              <span>Enable Betting Simulation</span>
            </label>

            <div className="settings-form-actions">
              <button type="submit" disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Update System Settings"}
              </button>

              <button
                type="button"
                className="reset-btn"
                onClick={handleResetCapital}
              >
                Reset System Capital
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ---------------- WEBSITE ACTIVITY SETTINGS ---------------- */}

      <section className="settings-section activity-settings-section">
        <div className="settings-section-header">
          <div>
            <h3>Website Activity Counter</h3>
            <p>
              Configure the minimum and maximum simulated activity displayed
              across the website.
            </p>
          </div>

          <span className="activity-status-label">
            <span className="activity-status-dot" />
            PROGRAMMED ACTIVITY
          </span>
        </div>

        <div className="activity-information">
          <strong>How this works</strong>

          <p>
            The system generates a website-wide activity total within your
            configured range. It automatically distributes that total across
            active platforms and their active leagues.
          </p>

          <p>
            Activity figures are regenerated every 20 seconds. Website
            components retrieve updated figures every 5 seconds.
          </p>

          <p>
            These are programmed activity figures, not actual visitor analytics
            or verified live-user counts.
          </p>
        </div>

        {activityError && <div className="admin-error">{activityError}</div>}

        {activitySuccess && (
          <div className="admin-success">{activitySuccess}</div>
        )}

        {activityLoading ? (
          <p className="settings-loading">Loading activity settings...</p>
        ) : (
          <form
            className="activity-settings-form"
            onSubmit={handleUpdateActivity}
          >
            <div className="activity-input-grid">
              <div className="settings-field">
                <label htmlFor="activity-min">Minimum Website Activity</label>

                <input
                  id="activity-min"
                  name="activityMin"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  placeholder="e.g. 100"
                  value={activitySettings.activityMin}
                  onChange={handleActivityChange}
                  required
                />

                <small>Lowest website-wide activity figure.</small>
              </div>

              <div className="settings-field">
                <label htmlFor="activity-max">Maximum Website Activity</label>

                <input
                  id="activity-max"
                  name="activityMax"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  placeholder="e.g. 250"
                  value={activitySettings.activityMax}
                  onChange={handleActivityChange}
                  required
                />

                <small>Highest website-wide activity figure.</small>
              </div>
            </div>

            <div className="activity-range-preview">
              <span>Configured activity range</span>

              <strong>
                {activitySettings.activityMin === "" ||
                activitySettings.activityMax === ""
                  ? "Not configured"
                  : `${Number(activitySettings.activityMin).toLocaleString()} – ${Number(activitySettings.activityMax).toLocaleString()}`}
              </strong>
            </div>

            <div className="settings-form-actions">
              <button type="submit" disabled={savingActivity}>
                {savingActivity
                  ? "Saving Activity Settings..."
                  : "Save Activity Settings"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ---------------- LEAGUE CAPITALS ---------------- */}

      <section className="settings-section league-capitals-section">
        <div className="settings-section-header">
          <div>
            <h3>League Capitals</h3>
            <p>View and manage the capital assigned to individual leagues.</p>
          </div>
        </div>

        <button
          type="button"
          className="reset-all-leagues-btn"
          onClick={handleResetAllLeagues}
        >
          Reset All League Capitals
        </button>

        <div className="league-capitals">
          {leagues.length === 0 ? (
            <p className="settings-loading">No leagues found.</p>
          ) : (
            leagues.map((league) => (
              <div key={league.id} className="league-capital-card">
                <strong>
                  {league.platform} - {league.leagueName}
                </strong>

                <div>
                  Capital: {Number(league.capital || 0).toLocaleString()}
                </div>

                <span
                  className={
                    league.isActive
                      ? "league-status active"
                      : "league-status inactive"
                  }
                >
                  {league.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
