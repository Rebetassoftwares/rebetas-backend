import { useEffect, useMemo, useState } from "react";
import { getPayments } from "../../../services/adminApi";
import { formatMoney } from "../../../utils/currency";
import "./Payments.css";

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

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const res = await getPayments();

      if (Array.isArray(res)) {
        setPayments(res);
      } else {
        console.warn("Unexpected payments response:", res);
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const currencies = useMemo(() => {
    return [...new Set(payments.map((p) => p.currency).filter(Boolean))].sort();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const userText = getUserSearchText(p.userId);
      const emailText =
        typeof p.userId === "object" && p.userId?.email
          ? p.userId.email.toLowerCase()
          : "";

      const referenceText = (p.reference || "").toLowerCase();
      const query = search.trim().toLowerCase();

      if (
        query &&
        !userText.includes(query) &&
        !emailText.includes(query) &&
        !referenceText.includes(query)
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        (p.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (currencyFilter !== "all" && p.currency !== currencyFilter) {
        return false;
      }

      if (fromDate) {
        const createdAt = new Date(p.createdAt);
        const from = new Date(fromDate);
        if (createdAt < from) return false;
      }

      if (toDate) {
        const createdAt = new Date(p.createdAt);
        const to = new Date(`${toDate}T23:59:59`);
        if (createdAt > to) return false;
      }

      return true;
    });
  }, [payments, search, statusFilter, currencyFilter, fromDate, toDate]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setCurrencyFilter("all");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h2>Payments</h2>
          <p className="payments-subtitle">
            Monitor all recorded payments across currencies.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="payments-filters">
        <input
          type="text"
          placeholder="Search by user or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
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

      <div className="payments-meta">
        <span>
          Showing <strong>{filteredPayments.length}</strong> of{" "}
          <strong>{payments.length}</strong> payments
        </span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredPayments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        <div className="payments-table">
          <div className="table-head">
            <span>User</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {filteredPayments.map((p) => (
            <div key={p._id} className="table-row">
              <span>{getUserDisplay(p.userId)}</span>

              <span>{formatMoney(p.currency, p.amount)}</span>

              <span
                className={`status ${
                  p.status === "success"
                    ? "success"
                    : p.status === "pending"
                      ? "pending"
                      : "failed"
                }`}
              >
                {p.status || "unknown"}
              </span>

              <span>
                {p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
