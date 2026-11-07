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
        <Link
          to="/dashboard"
          className="dashboard-logo"
          onClick={closeMenu}
          aria-label="SunStreamers dashboard"
        >
          <img
            src="/sunstreamers_icon.png"
            alt="SunStreamers"
            className="dashboard-logo-image"
          />
        </Link>

        <nav className="dashboard-nav-links" aria-label="Dashboard navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tutorials">Tutorials</Link>
          <Link to="/supported-platforms">Platforms</Link>
        </nav>

        <div className="dashboard-user-actions">
          <Link
            to="/notifications"
            className="notification-link"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <span className="notification-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </span>

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link to="/account" className="dashboard-account">
            Account
          </Link>

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <button
          type="button"
          className={`dashboard-menu-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close dashboard menu" : "Open dashboard menu"}
          aria-expanded={menuOpen}
          aria-controls="dashboard-mobile-menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div
        id="dashboard-mobile-menu"
        className={`dashboard-mobile-menu ${menuOpen ? "open" : ""}`}
      >
        <nav aria-label="Mobile dashboard navigation">
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
            Notifications
            {unreadCount > 0 && (
              <span className="mobile-notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="dashboard-mobile-actions">
          <Link to="/account" className="dashboard-account" onClick={closeMenu}>
            Account
          </Link>

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
