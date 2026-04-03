import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createLeague,
  updateLeague,
  getLeagueById,
  getPlatforms,
} from "../../../services/adminApi";
import "./LeagueForm.css";
import { getImageUrl } from "../../../utils/getImageUrl";

export default function LeagueForm() {
  const { leagueId } = useParams();
  const [searchParams] = useSearchParams();
  const queryPlatformId = searchParams.get("platformId");

  const navigate = useNavigate();

  const [platforms, setPlatforms] = useState([]);
  const [form, setForm] = useState({
    platform: "",
    platformId: queryPlatformId || "",
    leagueName: "",
    logo: "",
    mode: "",
    totalMatches: "",
    intervalMinutes: "",
    intervalSeconds: "", // ✅ NEW
    firstPredictionTime: "",
    teams: [],
    oddRange: { min: "", max: "" },
    cycleConfig: [],
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [error, setError] = useState("");

  // LOAD PLATFORMS
  useEffect(() => {
    async function loadPlatforms() {
      try {
        setLoadingPlatforms(true);

        const res = await getPlatforms();

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        setPlatforms(data);

        if (queryPlatformId && !leagueId) {
          const selected = data.find((p) => p._id === queryPlatformId);

          setForm((prev) => ({
            ...prev,
            platformId: queryPlatformId,
            platform: selected?.name || "",
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPlatforms(false);
      }
    }

    loadPlatforms();
  }, [queryPlatformId, leagueId]);

  // LOAD FOR EDIT
  useEffect(() => {
    if (!leagueId) return;

    async function loadLeague() {
      try {
        const res = await getLeagueById(leagueId);

        // ✅ FIX: support both res and res.data
        const data = res?.data || res;

        setForm({
          platform: data.platform || data.platformId?.name || "",
          platformId: data.platformId?._id || data.platformId || "",
          leagueName: data.leagueName || "",
          logo: data.logo || "",
          mode: (data.mode || "").toUpperCase(),
          totalMatches: data.totalMatches || "",
          intervalMinutes: data.intervalMinutes || "",
          intervalSeconds: data.intervalSeconds || "", // ✅ NEW
          firstPredictionTime: data.firstPredictionTime
            ? new Date(data.firstPredictionTime).toISOString().slice(0, 16)
            : "",
          teams: data.teams || [],
          oddRange: data.oddRange || { min: "", max: "" },
          cycleConfig:
            data.cycleConfig?.map((c) => ({
              ...c,
              current: c.current ?? c.start, // ✅ NEW
            })) || [],
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load league");
      }
    }

    loadLeague();
  }, [leagueId]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePlatformChange(e) {
    const selectedId = e.target.value;
    const selectedPlatform = platforms.find((p) => p._id === selectedId);

    setForm((prev) => ({
      ...prev,
      platformId: selectedId,
      platform: selectedPlatform?.name || "",
    }));
  }

  function addTeam() {
    setForm((prev) => ({
      ...prev,
      teams: [...prev.teams, { name: "", shortName: "" }],
    }));
  }

  function updateTeam(index, field, value) {
    const updated = [...form.teams];

    // ✅ FIX: avoid mutation
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setForm((prev) => ({
      ...prev,
      teams: updated,
    }));
  }

  function removeTeam(index) {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.filter((_, i) => i !== index),
    }));
  }

  function addCycle() {
    setForm((prev) => ({
      ...prev,
      cycleConfig: [
        ...prev.cycleConfig,
        { name: "", start: "", current: "", max: "" }, // ✅ NEW
      ],
    }));
  }

  function updateCycle(index, field, value) {
    const updated = [...form.cycleConfig];

    // ✅ FIX: avoid mutation
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setForm((prev) => ({
      ...prev,
      cycleConfig: updated,
    }));
  }

  function removeCycle(index) {
    setForm((prev) => ({
      ...prev,
      cycleConfig: prev.cycleConfig.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // ✅ FIX: validation
    if (!form.platformId || !form.leagueName || !form.mode) {
      setError("Platform, League Name and Mode are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      // basic fields
      formData.append("platform", form.platform);
      formData.append("platformId", form.platformId);
      formData.append("leagueName", form.leagueName);
      formData.append("mode", form.mode.toUpperCase());
      formData.append("totalMatches", Number(form.totalMatches));
      formData.append("intervalMinutes", Number(form.intervalMinutes));
      formData.append("intervalSeconds", Number(form.intervalSeconds || 0));
      formData.append("firstPredictionTime", form.firstPredictionTime);
      formData.append("isActive", form.isActive);

      // arrays (VERY IMPORTANT)
      formData.append("teams", JSON.stringify(form.teams));
      formData.append("cycleConfig", JSON.stringify(form.cycleConfig));

      // oddRange
      if (form.mode === "SEMI_AUTO") {
        formData.append(
          "oddRange",
          JSON.stringify({
            min: Number(form.oddRange.min),
            max: Number(form.oddRange.max),
          }),
        );
      }

      // logo
      if (form.logo instanceof File) {
        formData.append("logo", form.logo);
      } else if (typeof form.logo === "string") {
        formData.append("logo", form.logo); // fallback (edit mode)
      }

      if (leagueId) {
        await updateLeague(leagueId, formData);
      } else {
        await createLeague(formData);
      }

      navigate(-1);
    } catch (err) {
      console.error(err);
      setError("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="league-page">
      <div className="league-header">
        {/* PLATFORM BANNER */}
        {form.platformId && (
          <div className="platform-banner">
            {platforms.find((p) => p._id === form.platformId)?.logo && (
              <img
                src={getImageUrl(
                  platforms.find((p) => p._id === form.platformId).logo,
                )}
                alt="platform"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
        )}

        <h2>{leagueId ? "Edit League" : "Create League"}</h2>
        <p>Configure league settings and prediction behavior</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit} className="league-container">
        <div className="card">
          <h3>Basic Info</h3>

          <div className="field">
            <label>Platform</label>
            <select
              name="platformId"
              value={form.platformId}
              onChange={handlePlatformChange}
              disabled={loadingPlatforms}
            >
              <option value="">
                {loadingPlatforms ? "Loading platforms..." : "Select Platform"}
              </option>
              {platforms.map((platform) => (
                <option key={platform._id} value={platform._id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>League Name</label>
            <input
              name="leagueName"
              value={form.leagueName}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Mode</label>
            <select name="mode" value={form.mode} onChange={handleChange}>
              <option value="">Select Mode</option>
              <option value="AUTO">AUTO</option>
              <option value="MANUAL">MANUAL</option>
              <option value="SEMI_AUTO">SEMI AUTO</option>
            </select>
          </div>

          <div className="field">
            <label>Total Matches</label>
            <input
              type="number"
              name="totalMatches"
              value={form.totalMatches}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Interval</label>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                name="intervalMinutes"
                placeholder="Minutes"
                value={form.intervalMinutes}
                onChange={handleChange}
              />

              <input
                type="number"
                name="intervalSeconds"
                placeholder="Seconds"
                value={form.intervalSeconds}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label>First Prediction Time</label>
            <input
              type="datetime-local"
              name="firstPredictionTime"
              value={form.firstPredictionTime}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>League Logo</label>

            {/* PREVIEW */}
            {typeof form.logo === "string" && form.logo && (
              <div className="league-logo-preview">
                <img
                  src={getImageUrl(form.logo)}
                  alt="league"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {form.logo instanceof File && (
              <div className="league-logo-preview">
                <img src={URL.createObjectURL(form.logo)} alt="preview" />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  logo: e.target.files[0],
                }))
              }
            />
          </div>
        </div>

        {/* EVERYTHING BELOW REMAINS EXACTLY SAME */}

        <div className="card">
          <h3>Teams</h3>

          {form.teams.map((team, i) => (
            <div key={i} className="team-card">
              <input
                placeholder="Team Name"
                value={team.name}
                onChange={(e) => updateTeam(i, "name", e.target.value)}
              />

              <input
                placeholder="Short Name"
                value={team.shortName}
                onChange={(e) => updateTeam(i, "shortName", e.target.value)}
              />

              <button
                type="button"
                className="btn-danger"
                onClick={() => removeTeam(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn-add" onClick={addTeam}>
            + Add Team
          </button>
        </div>

        <div className="card">
          <h3>Cycles</h3>

          {form.cycleConfig.map((c, i) => (
            <div key={i} className="cycle-box">
              <input
                placeholder="Name (e.g Season)"
                value={c.name}
                onChange={(e) => updateCycle(i, "name", e.target.value)}
              />

              <input
                type="number"
                placeholder="Start"
                value={c.start}
                onChange={(e) => updateCycle(i, "start", e.target.value)}
              />

              <input
                type="number"
                placeholder="Current"
                value={c.current || ""}
                onChange={(e) => updateCycle(i, "current", e.target.value)}
              />

              <input
                type="number"
                placeholder="Max"
                value={c.max}
                onChange={(e) => updateCycle(i, "max", e.target.value)}
              />

              <button
                type="button"
                className="btn-danger"
                onClick={() => removeCycle(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn-add" onClick={addCycle}>
            + Add Cycle
          </button>
        </div>

        {form.mode === "SEMI_AUTO" && (
          <div className="card">
            <h3>Odd Range</h3>

            <div className="field">
              <label>Min Odd</label>
              <input
                value={form.oddRange.min}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    oddRange: { ...prev.oddRange, min: e.target.value },
                  }))
                }
              />
            </div>

            <div className="field">
              <label>Max Odd</label>
              <input
                value={form.oddRange.max}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    oddRange: { ...prev.oddRange, max: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        )}

        <div className="save-bar">
          <button className="btn-primary">
            {loading ? "Saving..." : "Save League"}
          </button>
        </div>
      </form>
    </div>
  );
}
