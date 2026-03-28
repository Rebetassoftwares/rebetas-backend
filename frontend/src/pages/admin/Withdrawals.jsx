import { useEffect, useState, useMemo } from "react";
import { getAllWithdrawals, processWithdrawal } from "../../services/adminApi";

import "./Withdrawals.css";

export default function Withdrawals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  // ✅ NEW FILTER STATES
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const res = await getAllWithdrawals();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(id, action, note = "") {
    try {
      setProcessingId(id);

      await processWithdrawal(id, {
        action,
        adminNote: note,
      });

      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  /* ============================
     FILTERED DATA
  ============================ */
  const filtered = useMemo(() => {
    return data.filter((w) => {
      // STATUS
      if (filter !== "all" && w.status !== filter) return false;

      // CURRENCY
      if (currencyFilter !== "all" && w.currency !== currencyFilter)
        return false;

      // DATE
      const created = new Date(w.createdAt);

      if (fromDate && created < new Date(fromDate)) return false;
      if (toDate && created > new Date(toDate + "T23:59:59")) return false;

      return true;
    });
  }, [data, filter, currencyFilter, fromDate, toDate]);

  /* ============================
     SUMMARY
  ============================ */
  const summary = useMemo(() => {
    let total = 0;
    let pending = 0;
    let approved = 0;

    data.forEach((w) => {
      total += w.amount;
      if (w.status === "pending") pending += w.amount;
      if (w.status === "approved") approved += w.amount;
    });

    return { total, pending, approved };
  }, [data]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="withdrawals-page">
      {/* HEADER */}
      <div className="header">
        <h1>Withdrawals</h1>

        <div className="filters">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ NEW EXTRA FILTERS */}
      <div className="extra-filters">
        {/* Currency */}
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
        >
          <option value="all">All Currencies</option>

          {[...new Set(data.map((w) => w.currency))].map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>

        {/* From */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        {/* To */}
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        {/* Reset */}
        <button
          onClick={() => {
            setFilter("all");
            setCurrencyFilter("all");
            setFromDate("");
            setToDate("");
          }}
        >
          Reset
        </button>
      </div>

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="card">
          <p>Total Requests</p>
          <h2>{summary.total}</h2>
        </div>

        <div className="card pending">
          <p>Pending</p>
          <h2>{summary.pending}</h2>
        </div>

        <div className="card approved">
          <p>Approved</p>
          <h2>{summary.approved}</h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="withdrawals-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((w) => (
              <tr key={w._id}>
                <td>{w.ownerId?.username || "-"}</td>
                <td>{w.currency}</td>
                <td>{w.amount}</td>

                <td>
                  <span className={`status ${w.status}`}>{w.status}</span>
                </td>

                <td>{new Date(w.createdAt).toLocaleDateString()}</td>

                <td>
                  <input
                    type="text"
                    placeholder="Admin note..."
                    defaultValue={w.adminNote || ""}
                    onBlur={(e) => (w._note = e.target.value)}
                  />
                </td>

                <td>
                  {w.status === "pending" ? (
                    <div className="actions">
                      <button
                        disabled={processingId === w._id}
                        className="approve"
                        onClick={() => handleAction(w._id, "approve", w._note)}
                      >
                        {processingId === w._id ? "..." : "Approve"}
                      </button>

                      <button
                        disabled={processingId === w._id}
                        className="reject"
                        onClick={() => handleAction(w._id, "reject", w._note)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="done">Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
