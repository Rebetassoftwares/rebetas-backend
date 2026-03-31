export default function PredictionBadges({ prediction, time }) {
  return (
    <div className="badge-row">
      {/* 🔥 Dynamic Cycles */}
      {prediction?.cycles?.length > 0 &&
        prediction.cycles.map((c, i) => (
          <div key={i} className="badge">
            {c.name}:<span>{c.value ?? "-"}</span>
          </div>
        ))}

      {/* 🔥 Live Time */}
      <div className="badge time-badge live-time">
        {time.toLocaleTimeString()}
      </div>

      {/* 🔥 Live Indicator */}
      <div className={`badge live-badge ${prediction ? "active" : "inactive"}`}>
        <span className="live-dot"></span>
        {prediction ? "LIVE" : "OFF"}
      </div>
    </div>
  );
}
