import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardNavbar.css";
import api from "../../services/api";

export default function DashboardNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

      // ✅ CLEAR CORRECT TOKEN
      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("user");

      // ✅ IMPORTANT: replace history
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);

      // ✅ FORCE CLEANUP
      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("user");

      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar-inner">
        <div className="dashboard-logo">
          <Link to="/dashboard">Rebetas</Link>
        </div>

        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav className={`dashboard-nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tutorials">Tutorials</Link>
          <Link to="/supported-platforms">Platforms</Link>
        </nav>

        <div className={`dashboard-user-actions ${menuOpen ? "open" : ""}`}>
          <Link to="/account" className="dashboard-account">
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
