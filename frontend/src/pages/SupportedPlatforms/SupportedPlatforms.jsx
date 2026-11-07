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

        const validLeagues = safeData;
        const grouped = {};

        validLeagues.forEach((league) => {
          let platform = league.platformId;

          if (!platform) return;

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

        const cleaned = Object.fromEntries(
          Object.entries(grouped).filter(
            ([, platform]) => platform.leagues.length > 0,
          ),
        );

        setGroupedPlatforms(cleaned);
      } catch (err) {
        console.error("League fetch error:", err);
        setError(
          "We couldn't retrieve the platform information. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeagues();
  }, []);

  const platforms = Object.values(groupedPlatforms);
  const totalLeagues = platforms.reduce(
    (total, platform) => total + platform.leagues.length,
    0,
  );

  return (
    <div className="platforms-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <section className="platforms-hero">
        <div className="container">
          <span className="platforms-eyebrow">SUNSTREAMERS COMPATIBILITY</span>

          <h1>
            One Signal Service.
            <span> Supported Virtual Football Platforms.</span>
          </h1>

          <p>
            Explore the betting platforms and virtual football leagues currently
            supported by SunStreamers. Find the platforms available for
            following our prediction signals.
          </p>

          <div className="platforms-hero-stats">
            <div className="platforms-stat">
              <strong>{loading ? "—" : platforms.length}</strong>
              <span>Supported platforms</span>
            </div>

            <div className="platforms-stat-divider" />

            <div className="platforms-stat">
              <strong>{loading ? "—" : totalLeagues}</strong>
              <span>Available leagues</span>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="platforms-feedback container" role="status">
          <span className="platforms-loader" />
          <p>Retrieving supported platforms and leagues...</p>
        </div>
      )}

      {!loading && error && (
        <div className="platforms-feedback container" role="alert">
          <p className="platforms-error">{error}</p>
        </div>
      )}

      {!loading && !error && platforms.length === 0 && (
        <div className="platforms-feedback container">
          <p>No supported platforms or leagues are currently available.</p>
        </div>
      )}

      {!loading && !error && platforms.length > 0 && (
        <>
          <section className="platform-section">
            <div className="container">
              <div className="platform-section-heading">
                <div>
                  <span className="platforms-section-label">
                    PLATFORM COMPATIBILITY
                  </span>
                  <h2>Supported Betting Platforms</h2>
                  <p>
                    These are the platforms represented in the current
                    SunStreamers supported-league database.
                  </p>
                </div>
              </div>

              <div className="platform-grid">
                {platforms.map((platform) => (
                  <div key={platform._id} className="platform-card">
                    <div className="platform-logo-wrap">
                      {platform.logo ? (
                        <img
                          src={getImageUrl(platform.logo)}
                          alt={`${platform.name} logo`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="platform-initial">
                          {platform.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="platform-name">{platform.name}</span>

                    <span className="platform-league-count">
                      {platform.leagues.length}{" "}
                      {platform.leagues.length === 1 ? "league" : "leagues"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="league-section">
            <div className="container">
              <div className="platform-section-heading">
                <div>
                  <span className="platforms-section-label">
                    VIRTUAL FOOTBALL COVERAGE
                  </span>
                  <h2>Available Virtual Football Leagues</h2>
                  <p>
                    Browse the virtual football leagues associated with each
                    supported platform.
                  </p>
                </div>
              </div>

              {platforms.map((platform) => (
                <div className="league-platform-group" key={platform._id}>
                  <div className="league-platform-heading">
                    <h3>{platform.name}</h3>
                    <span>
                      {platform.leagues.length}{" "}
                      {platform.leagues.length === 1 ? "league" : "leagues"}
                    </span>
                  </div>

                  <div className="league-grid">
                    {platform.leagues.map((league) => (
                      <div key={league._id} className="league-card">
                        <div className="league-logo-wrap">
                          {league.logo ? (
                            <img
                              src={getImageUrl(league.logo)}
                              alt={`${league.leagueName} logo`}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="league-initial">
                              {league.leagueName?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <span className="league-name">{league.leagueName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
