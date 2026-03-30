import { useEffect, useMemo, useState } from "react";
import {
  getSubscriptions,
  cancelSubscription,
} from "../../../services/adminApi";
import { formatMoney } from "../../../utils/currency";
import "./Subscriptions.css";

function getUserDisplay(user) {
  if (!user) return "N/A";

  if (typeof user === "string") return user;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span>{user.fullName || user.username || "N/A"}</span>

      {user.username && (
        <small style={{ opacity: 0.6 }}>@{user.username}</small>
      )}

      {user.email && <small style={{ opacity: 0.6 }}>{user.email}</small>}

      {user.country && <small style={{ opacity: 0.6 }}>{user.country}</small>}
    </div>
  );
}

function getUserSearchText(user) {
  if (!user) return "";

  if (typeof user === "string") return user.toLowerCase();

  return [user.fullName, user.username, user.email, user.country]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadSubscriptions() {
    try {
      setLoading(true);
      setError("");

      const res = await getSubscriptions();

      if (Array.isArray(res)) {
        setSubs(res);
      } else {
        console.warn("Unexpected subscriptions response:", res);
        setSubs([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load subscriptions");
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this subscription?")) return;

    try {
      await cancelSubscription(id);
      loadSubscriptions();
    } catch (err) {
      console.error(err);
      setError("Cancel failed");
    }
  }

  const currencies = useMemo(() => {
    return [...new Set(subs.map((s) => s.currency).filter(Boolean))].sort();
  }, [subs]);

  const filteredSubs = useMemo(() => {
    return subs.filter((s) => {
      const userText = getUserSearchText(s.userId);
      const query = search.trim().toLowerCase();

      if (query && !userText.includes(query)) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        (s.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (planFilter !== "all" && (s.plan || "").toLowerCase() !== planFilter) {
        return false;
      }

      if (currencyFilter !== "all" && s.currency !== currencyFilter) {
        return false;
      }

      if (fromDate) {
        const createdAt = new Date(s.createdAt);
        const from = new Date(fromDate);
        if (createdAt < from) return false;
      }

      if (toDate) {
        const createdAt = new Date(s.createdAt);
        const to = new Date(`${toDate}T23:59:59`);
        if (createdAt > to) return false;
      }

      return true;
    });
  }, [
    subs,
    search,
    statusFilter,
    planFilter,
    currencyFilter,
    fromDate,
    toDate,
  ]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setCurrencyFilter("all");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="subs-page">
      <div className="subs-header">
        <div>
          <h2>Subscriptions</h2>
          <p className="subs-subtitle">
            Monitor all user subscriptions across plans and currencies.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="subs-filters">
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="all">All Plans</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
        >
          <option value="all">All Currencies</option>
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button type="button" onClick={resetFilters}>
          Reset
        </button>
      </div>

      <div className="subs-meta">
        <span>
          Showing <strong>{filteredSubs.length}</strong> of{" "}
          <strong>{subs.length}</strong> subscriptions
        </span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredSubs.length === 0 ? (
        <p>No subscriptions found</p>
      ) : (
        <div className="subs-table">
          <div className="table-head">
            <span>User</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Start Date</span>
            <span>End Date</span>
            <span>Action</span>
          </div>

          {filteredSubs.map((s) => (
            <div key={s._id} className="table-row">
              <span>{getUserDisplay(s.userId)}</span>

              <span>{s.plan || "N/A"}</span>

              <span>{formatMoney(s.currency, s.amount)}</span>

              <span
                className={`status ${
                  s.status === "active" ? "active" : "cancelled"
                }`}
              >
                {s.status || "unknown"}
              </span>

              <span>
                {s.startDate ? new Date(s.startDate).toLocaleDateString() : "-"}
              </span>

              <span>
                {s.endDate ? new Date(s.endDate).toLocaleDateString() : "-"}
              </span>

              <div className="actions">
                {s.status === "active" && (
                  <button onClick={() => handleCancel(s._id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
