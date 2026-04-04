import { useEffect, useState } from "react";
import {
  getPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getLeaguesByPlatform,
} from "../../../services/adminApi";
import { useNavigate } from "react-router-dom";
import PlatformFormModal from "./PlatformFormModal";
import "./PlatformPage.css";
import { getImageUrl } from "../../../utils/getImageUrl";

export default function PlatformPage() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);

  const navigate = useNavigate();

  /* ================= LOAD ================= */

  async function loadPlatforms() {
    try {
      setLoading(true);
      setError("");

      const res = await getPlatforms();

      const baseData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      // 🔥 Fetch leagues in parallel safely
      const enriched = await Promise.all(
        baseData.map(async (platform) => {
          try {
            const leaguesRes = await getLeaguesByPlatform(platform._id);
            const leagues = Array.isArray(leaguesRes?.data)
              ? leaguesRes.data
              : [];

            const modeCount = {
              AUTO: 0,
              MANUAL: 0,
              SEMI_AUTO: 0,
            };

            leagues.forEach((l) => {
              if (modeCount[l.mode] !== undefined) {
                modeCount[l.mode]++;
              }
            });

            return {
              ...platform,
              leagueCount: leagues.length,
              modeCount,
              hasLeagueError: false,
            };
          } catch (err) {
            console.error(
              `Leagues fetch failed for platform ${platform._id}`,
              err,
            );

            return {
              ...platform,
              leagueCount: null, // 🔥 IMPORTANT (not fake 0)
              modeCount: null,
              hasLeagueError: true,
            };
          }
        }),
      );

      setPlatforms(enriched);
    } catch (err) {
      console.error(err);
      setError("Failed to load platforms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setShowModal(false); // ✅ force modal closed on load
    loadPlatforms();
  }, []);

  /* ================= ACTIONS ================= */

  function openCreate() {
    setEditingPlatform(null);
    setShowModal(true);
  }

  function openEdit(platform) {
    setEditingPlatform(platform);
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this platform?")) return;

    try {
      await deletePlatform(id);
      loadPlatforms();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  }

  async function handleSubmit(data) {
    try {
      if (editingPlatform) {
        await updatePlatform(editingPlatform._id, data);
      } else {
        await createPlatform(data);
      }

      setShowModal(false);
      loadPlatforms();
    } catch (err) {
      console.error(err);
      setError("Save failed");
    }
  }

  function goToLeagues(platformId) {
    navigate(`/admin/predictions/${platformId}/leagues`);
  }

  /* ================= UI ================= */

  return (
    <div className="platform-page">
      {/* HEADER */}
      <div className="platform-header">
        <div>
          <h2>Platform Setup</h2>
          <p>Manage betting platforms and their leagues</p>
        </div>

        <button className="btn-primary" onClick={openCreate}>
          + Add Platform
        </button>
      </div>

      {/* STATES */}
      {loading && <p className="platform-loading">Loading platforms...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && platforms.length === 0 && (
        <div className="platform-empty">No platforms found.</div>
      )}

      {/* GRID */}
      <div className="platform-table">
        {platforms.map((p) => (
          <div key={p._id} className="platform-card">
            {/* TOP */}
            <div className="platform-top">
              <div className="platform-logo">
                {p.logo ? (
                  <img src={getImageUrl(p.logo)} alt={p.name} />
                ) : (
                  <span>{p.name?.charAt(0)}</span>
                )}
              </div>

              <div>
                <h3>{p.name}</h3>
                <p>{p.country || "No country"}</p>
              </div>
            </div>

            {/* STATUS */}
            <span className={`status ${p.isActive ? "active" : "inactive"}`}>
              {p.isActive ? "Active" : "Inactive"}
            </span>

            {/* LEAGUE INFO */}
            <div className="platform-stats">
              {p.hasLeagueError ? (
                <p className="error">Failed to load leagues</p>
              ) : (
                <>
                  <p>
                    Total Leagues:{" "}
                    {p.leagueCount !== null ? p.leagueCount : "..."}
                  </p>

                  <div className="mode-count">
                    <span>AUTO: {p.modeCount?.AUTO || 0}</span>
                    <span>MANUAL: {p.modeCount?.MANUAL || 0}</span>
                    <span>SEMI: {p.modeCount?.SEMI_AUTO || 0}</span>
                  </div>
                </>
              )}
            </div>

            {/* ACTIONS */}
            <div className="actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(p);
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p._id);
                }}
              >
                Delete
              </button>
            </div>

            {/* NAV */}
            <button
              className="view-btn"
              onClick={(e) => {
                e.stopPropagation();
                goToLeagues(p._id);
              }}
            >
              View Leagues →
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <PlatformFormModal
          initialData={editingPlatform}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
