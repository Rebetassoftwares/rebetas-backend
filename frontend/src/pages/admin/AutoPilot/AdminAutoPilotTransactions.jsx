import { useEffect, useState } from "react";
import { getAutoPilotTransactions } from "../../../services/adminApi";
import "./AdminAutoPilotTransactions.css";

export default function AdminAutoPilotTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [date, setDate] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions(targetPage = page) {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: targetPage,
        limit: 50,
      };

      if (type) params.type = type;
      if (status) params.status = status;
      if (currency) params.currency = currency;
      if (date) params.date = date;

      const res = await getAutoPilotTransactions(params);

      setTransactions(
        Array.isArray(res?.data?.transactions) ? res.data.transactions : [],
      );
      setPagination(res?.data?.pagination || null);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      setError("Failed to load AutoPilot transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError("");

        const params = {
          page: 1,
          limit: 50,
        };

        if (type) params.type = type;
        if (status) params.status = status;
        if (currency) params.currency = currency;
        if (date) params.date = date;

        const res = await getAutoPilotTransactions(params);

        setTransactions(
          Array.isArray(res?.data?.transactions) ? res.data.transactions : [],
        );
        setPagination(res?.data?.pagination || null);
        setPage(1);
      } catch (err) {
        console.error(err);
        setError("Failed to load AutoPilot transactions");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [type, status, currency, date]);

  function formatAmount(value, currencyCode = "") {
    return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
  }

  function formatType(value = "") {
    return String(value).replaceAll("_", " ");
  }

  function resetFilters() {
    setType("");
    setStatus("");
    setCurrency("");
    setDate("");
    setPage(1);
  }

  return (
    <div className="autopilot-transactions-page">
      <div className="transactions-header">
        <div>
          <h2>🧾 AutoPilot Transactions</h2>
          <p>
            View the full AutoPilot ledger for deposits, Profit Credit,
            withdrawals and Compound Profit.
          </p>
        </div>

        <button onClick={() => loadTransactions(page)}>Refresh</button>
      </div>

      {error && <div className="transactions-error">{error}</div>}

      <div className="transactions-filters">
        <div className="filter-item">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="profit_credit">Profit Credit</option>
            <option value="compound">Compound Profit</option>
            <option value="profit_withdrawal">Profit Withdrawal</option>
            <option value="capital_withdrawal">Capital Withdrawal</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="">All Currency</option>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="GHS">GHS</option>
            <option value="KES">KES</option>
            <option value="ZAR">ZAR</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button className="reset-filter-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {loading ? (
        <div className="transactions-loading">
          Loading AutoPilot transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="transactions-loading">
          No AutoPilot transactions found.
        </div>
      ) : (
        <div className="transactions-table-card">
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Capital Before</th>
                  <th>Profit Before</th>
                  <th>Capital After</th>
                  <th>Profit After</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="transaction-user">
                        <strong>
                          {item.user?.fullName ||
                            item.user?.username ||
                            "Unknown User"}
                        </strong>
                        <span>{item.user?.email || "No email"}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`transaction-type ${item.type}`}>
                        {formatType(item.type)}
                      </span>
                    </td>

                    <td>
                      <span className={`transaction-status ${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>{formatAmount(item.amount, item.currency)}</td>

                    <td>
                      {formatAmount(
                        item.balanceBefore?.capitalBalance,
                        item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceBefore?.profitBalance,
                        item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceAfter?.capitalBalance,
                        item.currency,
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceAfter?.profitBalance,
                        item.currency,
                      )}
                    </td>

                    <td>{item.description || "—"}</td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="transactions-pagination">
              <button
                disabled={page <= 1}
                onClick={() => loadTransactions(page - 1)}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.pages || 1}
              </span>

              <button
                disabled={page >= pagination.pages}
                onClick={() => loadTransactions(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
