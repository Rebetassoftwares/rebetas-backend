import { useState } from "react";
import { Link } from "react-router-dom";
import "./AutoPilotLaunchPopup.css";

const logo = "/rebetas-icon.png";

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

        <img src={logo} alt="Rebetas" className="autopilot-popup-logo" />

        <span className="autopilot-popup-badge">
          Celebrating 4 Years of Rebetas
        </span>

        <h2>Rebetas AutoPilot is Finally Here</h2>

        <p>
          We are excited to officially launch Rebetas AutoPilot as part of our
          4th anniversary celebration.
        </p>

        <p>
          AutoPilot helps you earn more easily while Rebetas handles the daily
          activity for you.
        </p>

        <div className="autopilot-popup-benefits">
          <span>Daily Profit Updates</span>
          <span>Withdraw Anytime</span>
          <span>Compound Anytime</span>
          <span>Rebetas Handles The Work</span>
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
