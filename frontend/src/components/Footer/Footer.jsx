import { Link } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./Footer.css";

export default function Footer() {
  const countries = [
    { name: "Nigeria", code: "NG" },
    { name: "Ghana", code: "GH" },
    { name: "Kenya", code: "KE" },
    { name: "Uganda", code: "UG" },
    { name: "Tanzania", code: "TZ" },
    { name: "South Africa", code: "ZA" },
    { name: "Zambia", code: "ZM" },
    { name: "Zimbabwe", code: "ZW" },
    { name: "Botswana", code: "BW" },
    { name: "Namibia", code: "NA" },
    { name: "Rwanda", code: "RW" },
    { name: "Morocco", code: "MA" },
    { name: "Tunisia", code: "TN" },

    { name: "United Kingdom", code: "GB" },
    { name: "Ireland", code: "IE" },
    { name: "Germany", code: "DE" },
    { name: "France", code: "FR" },
    { name: "Spain", code: "ES" },
    { name: "Italy", code: "IT" },
    { name: "Netherlands", code: "NL" },
    { name: "Belgium", code: "BE" },
    { name: "Sweden", code: "SE" },
    { name: "Norway", code: "NO" },
    { name: "Denmark", code: "DK" },
    { name: "Finland", code: "FI" },
    { name: "Portugal", code: "PT" },
    { name: "Poland", code: "PL" },
    { name: "Czech Republic", code: "CZ" },
    { name: "Austria", code: "AT" },
    { name: "Switzerland", code: "CH" },
    { name: "Greece", code: "GR" },
    { name: "Romania", code: "RO" },
    { name: "Hungary", code: "HU" },
    { name: "Croatia", code: "HR" },
    { name: "Serbia", code: "RS" },
    { name: "Bulgaria", code: "BG" },
    { name: "Slovakia", code: "SK" },
    { name: "Slovenia", code: "SI" },

    { name: "Canada", code: "CA" },
    { name: "United States", code: "US" },
    { name: "Mexico", code: "MX" },

    { name: "Brazil", code: "BR" },
    { name: "Argentina", code: "AR" },
    { name: "Chile", code: "CL" },
    { name: "Colombia", code: "CO" },
    { name: "Peru", code: "PE" },
    { name: "Ecuador", code: "EC" },
    { name: "Paraguay", code: "PY" },
    { name: "Uruguay", code: "UY" },

    { name: "India", code: "IN" },
    { name: "Philippines", code: "PH" },
    { name: "Singapore", code: "SG" },
    { name: "Japan", code: "JP" },
    { name: "South Korea", code: "KR" },
    { name: "Vietnam", code: "VN" },

    { name: "Turkey", code: "TR" },

    { name: "Australia", code: "AU" },
    { name: "New Zealand", code: "NZ" },
  ];

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>Rebetas</h3>
          <p>
            AI powered virtual football prediction software designed to improve
            betting decisions.
          </p>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/pricing">Pricing</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Resources</h4>
          <ul>
            <li>
              <Link to="/tutorials">Tutorials</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Platforms</h4>
          <ul>
            <li>
              <Link to="/supported-platforms">Supported Platforms</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 🔥 NEW: COUNTRY LIST + FLAGS */}
      <div className="footer-countries">
        <p className="footer-country-text">
          Used by bettors across multiple regions including:
        </p>

        <p className="footer-country-list">
          <div className="country-tags">
            {countries.map((c) => (
              <span key={c.code}>{c.name}</span>
            ))}
          </div>
        </p>

        <div className="footer-flags">
          {countries.map((c) => (
            <ReactCountryFlag
              key={c.code}
              countryCode={c.code}
              svg
              title={c.name}
              style={{
                width: "26px",
                height: "26px",
              }}
            />
          ))}
        </div>
      </div>

      <div className="footer-bottom">© 2026 Rebetas. All rights reserved.</div>
    </footer>
  );
}
