import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardNavbar.css";
import api from "../../services/api";

export default function DashboardNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadCount(res?.data?.unreadCount || 0);
      } catch (error) {
        console.error("Notification count error:", error);
        setUnreadCount(0);
      }
    }

    loadUnreadCount();
  }, []);

  async function handleLogout() {
    try {
      await api.post("/user/logout", {});

      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("rebetas_user");
      localStorage.removeItem("user");

      closeMenu();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);

      localStorage.removeItem("rebetas_token");
      localStorage.removeItem("rebetas_user");
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

        <nav className="dashboard-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tutorials">Tutorials</Link>
          <Link to="/supported-platforms">Platforms</Link>
        </nav>

        <div className="dashboard-user-actions">
          <Link to="/notifications" className="notification-link">
            <span className="notification-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link to="/account" className="dashboard-account">
            Account
          </Link>

          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

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

        <Link to="/notifications" onClick={closeMenu}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
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
