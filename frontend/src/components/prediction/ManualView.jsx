import { getImageUrl } from "../../utils/getImageUrl";

import homeJersey from "../../assets/jerseys/home.png";
import awayJersey from "../../assets/jerseys/away.png";

export default function ManualView({
  prediction,
  isLocked,
  homeTeam,
  awayTeam,
  selectedLogo,
  countdown,
  formatCountdown,
  isManual,
}) {
  return (
    <div className="match-layout">
      {/* LEFT TEAM */}
      <div className="team-block">
        <img src={homeJersey} className="jersey-img" />
        <span className={`team-name ${isLocked ? "blurred" : ""}`}>
          {isLocked ? "🔒 HOME" : homeTeam}
        </span>
      </div>

      {/* CENTER */}
      <div className="center-block">
        <img
          src={getImageUrl(selectedLogo)}
          className="center-logo"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className={`prediction-circle ${isLocked ? "locked" : ""}`}>
          {isLocked ? "🔒" : prediction?.prediction || "-"}
        </div>

        {isManual && (
          <div className="match-number">
            Match #{prediction?.matchNumber || "-"}
          </div>
        )}

        <div className="prediction-odds-row">
          <span className={isLocked ? "blurred" : ""}>
            {isLocked ? "🔒 ODDS" : `Odds: ${prediction?.odd || "-"}`}
          </span>
        </div>

        <div className="countdown">Next in: {formatCountdown(countdown)}</div>
      </div>

      {/* RIGHT TEAM */}
      <div className="team-block">
        <img src={awayJersey} className="jersey-img" />
        <span className={`team-name ${isLocked ? "blurred" : ""}`}>
          {isLocked ? "🔒 AWAY" : awayTeam}
        </span>
      </div>
    </div>
  );
}
