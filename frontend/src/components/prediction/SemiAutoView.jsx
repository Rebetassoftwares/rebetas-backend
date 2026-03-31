export default function SemiAutoView({
  prediction,
  isLocked,
  countdown,
  formatCountdown,
}) {
  return (
    <div className="semi-auto-layout">
      <div className={`team-name ${isLocked ? "blurred" : ""}`}>
        {isLocked ? "🔒 TEAM" : prediction?.team || "-"}
      </div>

      <div className={`prediction-text ${isLocked ? "locked" : ""}`}>
        {isLocked ? "🔒 LOCKED" : prediction?.prediction || "-"}
      </div>

      <div className="prediction-odds-row">
        <span className={isLocked ? "blurred" : ""}>
          {isLocked ? "🔒 ODDS" : `Odds: ${prediction?.odd || "-"}`}
        </span>
      </div>

      <div className="countdown">Next in: {formatCountdown(countdown)}</div>
    </div>
  );
}
