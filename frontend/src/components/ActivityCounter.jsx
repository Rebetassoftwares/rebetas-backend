import { useEffect, useState } from "react";
import api from "../services/api";
import "./ActivityCounter.css";

export default function ActivityCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      try {
        const response = await api.get("/activity");

        if (active && Number.isFinite(Number(response?.total))) {
          setCount(Number(response.total));
        }
      } catch (error) {
        console.error("Activity counter error:", error);
      }
    };

    loadActivity();

    const intervalId = setInterval(loadActivity, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  if (count === null) return null;

  return (
    <div
      className="activity-floating-badge"
      role="status"
      aria-live="polite"
      aria-label={`${count.toLocaleString()} people online`}
    >
      <span className="activity-live-icon" aria-hidden="true">
        👤
      </span>

      <span className="activity-live-label">LIVE</span>

      <span className="activity-live-count">{count.toLocaleString()}</span>

      <span className="activity-live-text">online</span>
    </div>
  );
}
