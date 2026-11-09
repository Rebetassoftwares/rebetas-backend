import { getImageUrl } from "../../utils/getImageUrl";

export default function PlatformBanner({
  platformName,
  platformLogo,
  leagueOptions = [],
  league,
  setLeague,
  leagueActivityCounts = {},
}) {
  return (
    <div className="platform-banner">
      {/* BACKGROUND IMAGE */}
      {platformLogo && (
        <div className="platform-banner-bg">
          <img
            src={getImageUrl(platformLogo)}
            alt={platformName}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* CONTENT */}
      <div className="platform-banner-content">
        <div className="platform-name">{platformName?.toUpperCase()}</div>

        <div className="league-bar">
          {leagueOptions.map((item) => {
            const activityCount = leagueActivityCounts[String(item._id)];

            return (
              <button
                key={item._id}
                className={
                  league === item._id ? "league-btn active" : "league-btn"
                }
                onClick={() => setLeague(item._id)}
              >
                <span>{item.leagueName}</span>

                {activityCount !== undefined && activityCount !== null && (
                  <span
                    className="league-activity-badge"
                    aria-label={`${Number(activityCount).toLocaleString()} people using ${item.leagueName}`}
                  >
                    <span aria-hidden="true">👤</span>
                    <span>{Number(activityCount).toLocaleString()}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
