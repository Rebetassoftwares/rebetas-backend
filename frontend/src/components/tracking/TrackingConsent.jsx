import { useState } from "react";
import {
  hasTrackingConsentChoice,
  setTrackingConsent,
} from "../../services/tracking";

import "./TrackingConsent.css";

export default function TrackingConsent() {
  const [visible, setVisible] = useState(() => !hasTrackingConsentChoice());

  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  const saveConsent = (analyticsChoice, advertisingChoice) => {
    setTrackingConsent({
      analytics: analyticsChoice,
      advertising: advertisingChoice,
    });

    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="tracking-consent-overlay">
      <section
        className="tracking-consent-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-consent-title"
      >
        <div className="tracking-consent-heading">
          <div>
            <h3 id="tracking-consent-title">Your Privacy Matters</h3>
            <span>SunStreamers</span>
          </div>
        </div>

        <p>
          We use cookies and similar technologies to understand how visitors use
          our website, improve our services and measure advertising performance.
        </p>

        <p>
          You can choose whether to allow analytics and advertising tracking.
          Essential website functionality does not depend on these optional
          technologies.
        </p>

        {showSettings && (
          <div className="tracking-consent-options">
            <label className="tracking-consent-option">
              <input type="checkbox" checked disabled />

              <span>
                <strong>Essential technologies</strong>
                <small>Required for core website functionality.</small>
              </span>
            </label>

            <label className="tracking-consent-option">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />

              <span>
                <strong>Analytics</strong>
                <small>Helps us understand website visits and usage.</small>
              </span>
            </label>

            <label className="tracking-consent-option">
              <input
                type="checkbox"
                checked={advertising}
                onChange={(event) => setAdvertising(event.target.checked)}
              />

              <span>
                <strong>Advertising</strong>
                <small>
                  Helps measure advertising campaigns and conversions.
                </small>
              </span>
            </label>
          </div>
        )}

        <div className="tracking-consent-actions">
          <button
            type="button"
            className="tracking-consent-accept"
            onClick={() => saveConsent(true, true)}
          >
            Accept All
          </button>

          <button
            type="button"
            className="tracking-consent-reject"
            onClick={() => saveConsent(false, false)}
          >
            Reject Optional
          </button>

          <button
            type="button"
            className="tracking-consent-settings"
            onClick={() =>
              showSettings
                ? saveConsent(analytics, advertising)
                : setShowSettings(true)
            }
          >
            {showSettings ? "Save Preferences" : "Manage Preferences"}
          </button>
        </div>

        <a href="/privacy" className="tracking-consent-privacy">
          Read our Privacy Policy
        </a>
      </section>
    </div>
  );
}
