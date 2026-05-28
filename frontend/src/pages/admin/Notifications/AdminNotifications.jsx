import { useEffect, useState } from "react";
import {
  deleteAdminNotification,
  getAdminNotifications,
  sendAdminUserNotification,
} from "../../../services/adminApi";
import "./AdminNotifications.css";

const notificationTypes = [
  "system",
  "maintenance",
  "payment_initialized",
  "payment_successful",
  "package_activation",
  "profit_credit",
  "compound_profit",
  "profit_withdrawal",
  "capital_withdrawal",
  "withdrawal_approved",
  "withdrawal_rejected",
  "withdrawal_paid",
  "manual_profit_credit",
  "account_suspended",
  "account_reactivated",
  "capital_available",
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    userId: "",
    type: "",
    channel: "",
    isRead: "",
    page: 1,
    limit: 50,
  });

  const [form, setForm] = useState({
    userId: "",
    title: "",
    message: "",
    type: "system",
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadNotifications(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");

      const res = await getAdminNotifications(nextFilters);

      setNotifications(
        Array.isArray(res?.data?.notifications) ? res.data.notifications : [],
      );
      setPagination(res?.data?.pagination || null);
    } catch (err) {
      console.error("Admin notifications error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(name, value) {
    const nextFilters = {
      ...filters,
      [name]: value,
      page: 1,
    };

    setFilters(nextFilters);
  }

  async function applyFilters() {
    await loadNotifications(filters);
  }

  async function resetFilters() {
    const nextFilters = {
      userId: "",
      type: "",
      channel: "",
      isRead: "",
      page: 1,
      limit: 50,
    };

    setFilters(nextFilters);
    await loadNotifications(nextFilters);
  }

  async function goToPage(page) {
    const nextFilters = {
      ...filters,
      page,
    };

    setFilters(nextFilters);
    await loadNotifications(nextFilters);
  }

  async function handleSendNotification(e) {
    e.preventDefault();

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await sendAdminUserNotification(form);

      setSuccess("Notification sent successfully.");

      setForm({
        userId: "",
        title: "",
        message: "",
        type: "system",
      });

      await loadNotifications(filters);
    } catch (err) {
      console.error("Send admin notification error:", err);
      setError(err.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteAdminNotification(id);

      setSuccess("Notification deleted successfully.");
      await loadNotifications(filters);
    } catch (err) {
      console.error("Delete notification error:", err);
      setError(err.message || "Failed to delete notification.");
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  function formatType(type = "") {
    return String(type).replaceAll("_", " ");
  }

  return (
    <div className="admin-notifications-page">
      <div className="admin-notifications-header">
        <div>
          <span>Admin Notifications</span>
          <h1>Notifications</h1>
          <p>
            View user notifications and send manual in-app messages to Rebetas
            users.
          </p>
        </div>
      </div>

      {error && <div className="admin-notification-alert error">{error}</div>}
      {success && (
        <div className="admin-notification-alert success">{success}</div>
      )}

      <section className="admin-notification-grid">
        <form
          className="admin-notification-panel"
          onSubmit={handleSendNotification}
        >
          <h2>Send User Notification</h2>

          <label>
            User ID
            <input
              value={form.userId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, userId: e.target.value }))
              }
              placeholder="Paste user ID"
              required
            />
          </label>

          <label>
            Type
            <select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {formatType(type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Notification title"
              required
            />
          </label>

          <label>
            Message
            <textarea
              value={form.message}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Write the notification message"
              rows="5"
              required
            />
          </label>

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>

        <section className="admin-notification-panel">
          <h2>Filters</h2>

          <div className="admin-notification-filters">
            <label>
              User ID
              <input
                value={filters.userId}
                onChange={(e) => updateFilter("userId", e.target.value)}
                placeholder="Filter by user ID"
              />
            </label>

            <label>
              Type
              <select
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
              >
                <option value="">All Types</option>
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatType(type)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Channel
              <select
                value={filters.channel}
                onChange={(e) => updateFilter("channel", e.target.value)}
              >
                <option value="">All Channels</option>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
              </select>
            </label>

            <label>
              Read Status
              <select
                value={filters.isRead}
                onChange={(e) => updateFilter("isRead", e.target.value)}
              >
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </label>
          </div>

          <div className="admin-notification-actions">
            <button type="button" onClick={applyFilters}>
              Apply Filters
            </button>

            <button type="button" className="secondary" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </section>
      </section>

      <section className="admin-notifications-table-card">
        <div className="admin-notifications-table-head">
          <h2>All Notifications</h2>
          {pagination && (
            <span>
              {pagination.total} total · Page {pagination.page} of{" "}
              {pagination.pages || 1}
            </span>
          )}
        </div>

        {loading ? (
          <div className="admin-notification-state">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="admin-notification-state">
            No notifications found.
          </div>
        ) : (
          <div className="admin-notifications-table-wrap">
            <table className="admin-notifications-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {notifications.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>
                        {item.userId?.fullName ||
                          item.userId?.username ||
                          "Unknown User"}
                      </strong>
                      <small>{item.userId?.email || "—"}</small>
                    </td>

                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </td>

                    <td>{formatType(item.type)}</td>
                    <td>{item.channel}</td>

                    <td>
                      <span
                        className={`admin-notification-status ${
                          item.isRead ? "read" : "unread"
                        }`}
                      >
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                    </td>

                    <td>{formatDate(item.createdAt)}</td>

                    <td>
                      <button
                        className="delete-notification-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="admin-notification-pagination">
            <button
              disabled={Number(filters.page) <= 1 || loading}
              onClick={() => goToPage(Number(filters.page) - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              disabled={Number(filters.page) >= pagination.pages || loading}
              onClick={() => goToPage(Number(filters.page) + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
