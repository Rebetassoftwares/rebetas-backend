import { useEffect, useState } from "react";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import api from "../../services/api";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/notifications");

      setNotifications(res?.data?.notifications || []);
      setUnreadCount(res?.data?.unreadCount || 0);
    } catch (err) {
      console.error("Notifications load error:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`, {});

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark notification read error:", err);
      alert(err.message || "Failed to update notification");
    }
  }

  async function markAllAsRead() {
    try {
      setMarkingAll(true);

      await api.patch("/notifications/read-all", {});

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      alert(err.message || "Failed to update notifications");
    } finally {
      setMarkingAll(false);
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatType(type) {
    return String(type || "system")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <div className="notifications-page">
      <DashboardNavbar />

      <main className="notifications-container">
        <section className="notifications-hero">
          <div>
            <span>Rebetas Notifications</span>
            <h1>Notifications</h1>
            <p>
              Track AutoPilot updates, Profit Credits, withdrawals, payouts, and
              system messages.
            </p>
          </div>

          <div className="notifications-count-card">
            <small>Unread</small>
            <strong>{unreadCount}</strong>
          </div>
        </section>

        <section className="notifications-panel">
          <div className="notifications-panel-header">
            <div>
              <h2>Recent Notifications</h2>
              <p>{notifications.length} notification(s)</p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!unreadCount || markingAll}
            >
              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          </div>

          {loading ? (
            <div className="notifications-state">Loading notifications...</div>
          ) : error ? (
            <div className="notifications-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-state">
              No notifications available yet.
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notification-card ${
                    item.isRead ? "read" : "unread"
                  }`}
                >
                  <div className="notification-main">
                    <div className="notification-title-row">
                      <h3>{item.title}</h3>
                      {!item.isRead && <span>New</span>}
                    </div>

                    <p>{item.message}</p>

                    <div className="notification-meta">
                      <small>{formatType(item.type)}</small>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                  </div>

                  {!item.isRead && (
                    <button
                      type="button"
                      className="mark-read-btn"
                      onClick={() => markAsRead(item._id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
