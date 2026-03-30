import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import api from "../../services/api";
import { getImageUrl } from "../../utils/getImageUrl";
import "./SupportedPlatforms.css";

export default function SupportedPlatforms() {
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;

  const [groupedPlatforms, setGroupedPlatforms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    async function loadLeagues() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/manual-leagues");

        const safeData = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        // ✅ DO NOT FILTER (info page)
        const validLeagues = safeData;

        /* ---------------- GROUP BY PLATFORM ---------------- */

        const grouped = {};

        validLeagues.forEach((league) => {
          let platform = league.platformId;

          if (!platform) return;

          // 🔥 handle populated vs string
          if (typeof platform === "string") {
            platform = {
              _id: platform,
              name: league.platform || "Unknown",
              logo: "",
            };
          }

          if (!platform._id) return;

          if (!grouped[platform._id]) {
            grouped[platform._id] = {
              ...platform,
              leagues: [],
            };
          }

          grouped[platform._id].leagues.push(league);
        });

        // ✅ keep only platforms that actually have leagues
        const cleaned = Object.fromEntries(
          Object.entries(grouped).filter(
            ([, platform]) => platform.leagues.length > 0,
          ),
        );

        setGroupedPlatforms(cleaned);
      } catch (err) {
        console.error("League fetch error:", err);
        setError("Failed to load supported platforms and leagues");
      } finally {
        setLoading(false);
      }
    }

    loadLeagues();
  }, []);

  return (
    <div className="platforms-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      {/* HERO */}
      <section className="platforms-hero">
        <div className="container">
          <h1>Supported Platforms & Virtual Leagues</h1>

          <p>
            Rebetas works with the most popular virtual football betting
            platforms and leagues to deliver accurate AI-powered predictions.
          </p>
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <div className="container">
          <p className="info-text">Loading platforms...</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="container">
          <p className="error-text">{error}</p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && Object.keys(groupedPlatforms).length === 0 && (
        <div className="container">
          <p className="info-text">No platforms available yet.</p>
        </div>
      )}

      {/* PLATFORMS */}
      {!loading && !error && (
        <section className="platform-section">
          <div className="container">
            <h2>Supported Betting Platforms</h2>

            <div className="platform-grid">
              {Object.values(groupedPlatforms).map((platform) => (
                <div key={platform._id} className="platform-card">
                  {platform.logo ? (
                    <img
                      src={getImageUrl(platform.logo)}
                      alt={platform.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="platform-placeholder">{platform.name}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LEAGUES */}
      {!loading && !error && (
        <section className="league-section">
          <div className="container">
            <h2>Virtual Football Leagues</h2>

            <div className="league-grid">
              {Object.values(groupedPlatforms).map((platform) =>
                platform.leagues.map((league) => (
                  <div key={league._id} className="league-card">
                    {league.logo ? (
                      <img
                        src={getImageUrl(league.logo)}
                        alt={league.leagueName}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="league-placeholder">
                        {league.leagueName?.charAt(0)}
                      </div>
                    )}

                    <span>{league.leagueName}</span>
                  </div>
                )),
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
