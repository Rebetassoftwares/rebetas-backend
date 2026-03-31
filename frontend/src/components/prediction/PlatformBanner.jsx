import { getImageUrl } from "../../utils/getImageUrl";

export default function PlatformBanner({
  platformName,
  platformLogo,
  leagueOptions,
  league,
  setLeague,
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
          {leagueOptions.map((item) => (
            <button
              key={item._id}
              className={
                league === item._id ? "league-btn active" : "league-btn"
              }
              onClick={() => setLeague(item._id)}
            >
              {item.leagueName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
