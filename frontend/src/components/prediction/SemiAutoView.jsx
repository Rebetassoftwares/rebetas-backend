export default function SemiAutoView({
  prediction,
  isLocked,
  countdown,
  formatCountdown,
}) {
  return (
    <div className="semi-auto-layout">
      <div className={`team-name ${isLocked ? "blurred" : ""}`}>
        {isLocked ? "🔒 TEAM HIDDEN" : prediction?.team || "-"}
      </div>

      <div className={`prediction-text ${isLocked ? "locked" : ""}`}>
        {isLocked ? "🔒 PREDICTION LOCKED" : prediction?.prediction || "-"}
      </div>

      <div className="prediction-odds-row">
        <span className={isLocked ? "blurred" : ""}>
          {isLocked ? "🔒 ODDS HIDDEN" : `Odds: ${prediction?.odd || "-"}`}
        </span>
      </div>

      <div className="countdown">
        Next signal in: {formatCountdown(countdown)}
      </div>
    </div>
  );
}
