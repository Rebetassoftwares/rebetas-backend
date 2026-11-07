import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          {/* BRAND */}
          <div className="footer-brand">
            <Link
              to="/"
              className="footer-brand-logo"
              aria-label="SunStreamers home"
            >
              <img src="/sunstreamers_icon.png" alt="SunStreamers" />
            </Link>

            <h3>SunStreamers</h3>

            <p className="footer-description">
              A 24-hour virtual football prediction signal service designed to
              help users follow organized match predictions across supported
              virtual football betting platforms.
            </p>

            <p className="footer-brand-note">
              Make informed decisions. Manage your risk. Bet responsibly.
            </p>
          </div>

          {/* COMPANY */}
          <div className="footer-column">
            <h4>Company</h4>

            <ul>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/supported-platforms">Supported Platforms</Link>
              </li>
            </ul>
          </div>

          {/* RESOURCES */}
          <div className="footer-column">
            <h4>Resources</h4>

            <ul>
              <li>
                <Link to="/tutorials">Tutorials</Link>
              </li>
              <li>
                <Link to="/faq">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className="footer-column footer-contact">
            <h4>Contact Us</h4>

            <div className="footer-contact-item">
              <span className="footer-contact-label">Business Address</span>

              <address>
                Plot No: 143, Industrial Area, Ext. BLK III Revised, Chanshegu,
                Tamale-Kumasi Highway, Ghana.
              </address>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-label">Phone</span>
              <a href="tel:+233000000000">+233 00 000 0000</a>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-label">General Enquiries</span>
              <a href="mailto:info@sunstreamers.com">info@sunstreamers.com</a>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-label">Customer Support</span>
              <a href="mailto:support@sunstreamers.com">
                support@sunstreamers.com
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER DISCLAIMER */}
        <div className="footer-disclaimer">
          <p>
            SunStreamers provides virtual football prediction information and
            signals. Predictions are not guarantees of outcomes or profits.
            Betting involves financial risk, and users should make their own
            decisions and only stake amounts they can afford to lose.
          </p>
        </div>

        {/* FOOTER BOTTOM */}
        <div className="footer-bottom">
          <p>© {currentYear} SunStreamers. All rights reserved.</p>

          <div className="footer-legal-links">
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
