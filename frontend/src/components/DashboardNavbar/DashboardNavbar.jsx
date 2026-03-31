import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardNavbar.css";
import api from "../../services/api";

export default function DashboardNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem("rebetas_token");

      await api.post(
        "/user/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("user");

      closeMenu();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);

      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("user");

      closeMenu();
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar-inner">
        <div className="dashboard-logo">
          <Link to="/dashboard" onClick={closeMenu}>
            Rebetas
          </Link>
        </div>

        <div
          className="menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMenuOpen((prev) => !prev);
            }
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* DESKTOP NAV */}
        <nav className="dashboard-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tutorials">Tutorials</Link>
          <Link to="/supported-platforms">Platforms</Link>
        </nav>

        <div className="dashboard-user-actions">
          <Link to="/account" className="dashboard-account">
            Account
          </Link>

          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <Link to="/dashboard" onClick={closeMenu}>
          Dashboard
        </Link>

        <Link to="/tutorials" onClick={closeMenu}>
          Tutorials
        </Link>

        <Link to="/supported-platforms" onClick={closeMenu}>
          Platforms
        </Link>

        <div className="mobile-actions">
          <Link to="/account" className="dashboard-account" onClick={closeMenu}>
            Account
          </Link>

          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
