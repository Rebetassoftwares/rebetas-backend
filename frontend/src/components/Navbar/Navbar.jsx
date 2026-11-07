import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar rebetas-navbar">
      <div className="navbar-container">
        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
          aria-label="SunStreamers home"
        >
          <img
            src="/sunstreamers_icon.png"
            alt="SunStreamers"
            className="navbar-logo-image"
          />
        </Link>

        <button
          type="button"
          className={`menu-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div
          id="public-navigation"
          className={`nav-menu ${menuOpen ? "open" : ""}`}
        >
          <ul className="nav-links">
            <li>
              <Link to="/about" onClick={closeMenu}>
                About
              </Link>
            </li>
            <li>
              <Link to="/pricing" onClick={closeMenu}>
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/tutorials" onClick={closeMenu}>
                Tutorials
              </Link>
            </li>
            <li>
              <Link to="/faq" onClick={closeMenu}>
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/supported-platforms" onClick={closeMenu}>
                Platforms
              </Link>
            </li>
          </ul>

          <div className="nav-auth">
            <Link to="/login" className="login-btn" onClick={closeMenu}>
              Login
            </Link>

            <Link to="/register" className="register-btn" onClick={closeMenu}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
