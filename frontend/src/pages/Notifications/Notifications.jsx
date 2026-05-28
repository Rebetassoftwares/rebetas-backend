import { useCallback, useEffect, useState } from "react";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import api from "../../services/api";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "30",
        });

        if (unreadOnly) {
          params.append("unreadOnly", "true");
        }

        const res = await api.get(`/notifications?${params.toString()}`);

        setNotifications(
          Array.isArray(res?.data?.notifications) ? res.data.notifications : [],
        );

        setUnreadCount(Number(res?.data?.unreadCount || 0));
        setPagination(res?.data?.pagination || null);
        setPage(targetPage);
      } catch (err) {
        console.error("Notifications error:", err);
        setError(err.message || "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    async function fetchNotifications() {
      await loadNotifications(1);
    }

    fetchNotifications();
  }, [unreadOnly, loadNotifications]);

  async function markAsRead(id) {
    try {
      setActionLoading(true);
      setError("");

      await api.patch(`/notifications/${id}/read`, {});

      await loadNotifications(page);
    } catch (err) {
      console.error("Mark notification read error:", err);
      setError(err.message || "Failed to mark notification as read.");
    } finally {
      setActionLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      setActionLoading(true);
      setError("");

      await api.patch("/notifications/read-all", {});

      await loadNotifications(1);
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      setError(err.message || "Failed to mark all notifications as read.");
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  function getTypeLabel(type = "") {
    return String(type).replaceAll("_", " ");
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
              Track AutoPilot updates, payment alerts, Profit Credit activity,
              withdrawals, and system messages.
            </p>
          </div>

          <div className="notifications-count-box">
            <small>Unread</small>
            <strong>{unreadCount}</strong>
          </div>
        </section>

        <section className="notifications-toolbar">
          <button
            className={!unreadOnly ? "active" : ""}
            onClick={() => setUnreadOnly(false)}
          >
            All Notifications
          </button>

          <button
            className={unreadOnly ? "active" : ""}
            onClick={() => setUnreadOnly(true)}
          >
            Unread Only
          </button>

          <button
            className="mark-all-btn"
            disabled={actionLoading || unreadCount === 0}
            onClick={markAllAsRead}
          >
            Mark All as Read
          </button>
        </section>

        {error && <section className="notifications-error">{error}</section>}

        <section className="notifications-card">
          {loading ? (
            <div className="notifications-state">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-state">No notifications found.</div>
          ) : (
            <div className="notifications-list">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notification-item ${
                    item.isRead ? "read" : "unread"
                  }`}
                >
                  <div className="notification-icon">
                    {item.isRead ? "✓" : "●"}
                  </div>

                  <div className="notification-body">
                    <div className="notification-top">
                      <h3>{item.title || "Notification"}</h3>

                      <span className={`notification-type ${item.type || ""}`}>
                        {getTypeLabel(item.type || "system")}
                      </span>
                    </div>

                    <p>{item.message || "No message provided."}</p>

                    <div className="notification-meta">
                      <span>{formatDate(item.createdAt)}</span>

                      {item.channel && <span>{item.channel}</span>}
                    </div>
                  </div>

                  {!item.isRead && (
                    <button
                      className="read-btn"
                      disabled={actionLoading}
                      onClick={() => markAsRead(item._id)}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="notifications-pagination">
              <button
                disabled={page <= 1 || loading}
                onClick={() => loadNotifications(page - 1)}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                disabled={page >= pagination.pages || loading}
                onClick={() => loadNotifications(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
