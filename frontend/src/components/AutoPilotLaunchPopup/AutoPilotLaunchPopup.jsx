import { useState } from "react";
import { Link } from "react-router-dom";
import "./AutoPilotLaunchPopup.css";

const logo = "/sunstreamers-icon.png";

export default function AutoPilotLaunchPopup() {
  const [showPopup, setShowPopup] = useState(() => {
    return sessionStorage.getItem("autopilot_launch_popup_closed") !== "true";
  });

  const closePopup = () => {
    sessionStorage.setItem("autopilot_launch_popup_closed", "true");
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="autopilot-popup-overlay">
      <div className="autopilot-popup">
        <button className="autopilot-popup-close" onClick={closePopup}>
          ×
        </button>

        <img src={logo} alt="SunStreamers" className="autopilot-popup-logo" />

        <span className="autopilot-popup-badge">
          Celebrating 4 Years of SunStreamers
        </span>

        <h2>SunStreamers AutoPilot is Finally Here</h2>

        <p>
          We are excited to officially launch SunStreamers AutoPilot as part of
          our 4th anniversary celebration.
        </p>

        <p>
          AutoPilot helps you earn more easily while SunStreamers handles the
          daily activity for you.
        </p>

        <div className="autopilot-popup-benefits">
          <span>Daily Profit Updates</span>
          <span>Withdraw Anytime</span>
          <span>Compound Anytime</span>
          <span>SunStreamers Handles The Work</span>
        </div>

        <Link
          to="/investments"
          className="autopilot-popup-btn"
          onClick={closePopup}
        >
          Activate AutoPilot
        </Link>
      </div>
    </div>
  );
}
