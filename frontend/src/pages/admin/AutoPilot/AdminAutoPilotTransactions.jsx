import { useEffect, useState } from "react";
import { getAutoPilotTransactions } from "../../../services/adminApi";
import "./AdminAutoPilotTransactions.css";

const BASE_CURRENCY = "USD";

export default function AdminAutoPilotTransactions() {
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const params = {
        limit: 1000,
      };

      if (type) params.type = type;
      if (status) params.status = status;
      if (currency) params.currency = currency;
      if (date) params.date = date;

      const res = await getAutoPilotTransactions(params);

      setTransactions(
        Array.isArray(res?.data?.transactions) ? res.data.transactions : [],
      );
    } catch (err) {
      console.error("Load AutoPilot transactions error:", err);
      setError(err.message || "Failed to load AutoPilot transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, currency, date]);

  function formatAmount(value, currencyCode = "") {
    return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
  }

  function formatType(value = "") {
    return String(value).replaceAll("_", " ");
  }

  function getLocalCurrency(item) {
    return item.currency || item.account?.currency || "";
  }

  function getBaseCurrency(item) {
    return item.baseCurrency || BASE_CURRENCY;
  }

  function formatRate(item) {
    if (!item.exchangeRateSnapshot) return "Rate: —";

    return `Rate: 1 ${getBaseCurrency(item)} = ${Number(
      item.exchangeRateSnapshot,
    ).toLocaleString()} ${getLocalCurrency(item)}`;
  }

  const currencyOptions = [
    ...new Set(transactions.map((item) => item.currency).filter(Boolean)),
  ].sort();

  function resetFilters() {
    setType("");
    setStatus("");
    setCurrency("");
    setDate("");
  }

  return (
    <div className="autopilot-transactions-page">
      <div className="transactions-header">
        <div>
          <h2>🧾 AutoPilot Transactions</h2>
          <p>
            View the full AutoPilot ledger with local user values and USD admin
            tracking.
          </p>
        </div>

        <button type="button" onClick={loadTransactions} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="transactions-error">{error}</div>}

      <div className="transactions-filters">
        <div className="filter-item">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="package_activation">Package Activation</option>
            <option value="profit_credit">Profit Credit</option>
            <option value="profit_reinvest">Compound Profit</option>
            <option value="profit_withdrawal">Profit Withdrawal</option>
            <option value="capital_withdrawal">Capital Withdrawal</option>
            <option value="payout_failed">Payout Failed</option>
            <option value="payout_successful">Payout Successful</option>
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
          <label>User Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="">All Currency</option>

            {currencyOptions.map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>
                {currencyCode}
              </option>
            ))}
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

        <button
          type="button"
          className="reset-filter-btn"
          onClick={resetFilters}
        >
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
                  <th>Local Amount</th>
                  <th>USD Amount</th>
                  <th>Capital Before</th>
                  <th>Profit Before</th>
                  <th>Capital After</th>
                  <th>Profit After</th>
                  <th>Package</th>
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

                    <td>
                      <div className="money-stack">
                        <strong>
                          {formatAmount(item.amount, getLocalCurrency(item))}
                        </strong>
                        <span>{formatRate(item)}</span>
                      </div>
                    </td>

                    <td>
                      {formatAmount(item.baseAmount, getBaseCurrency(item))}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceBefore?.capitalBalance,
                        getLocalCurrency(item),
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceBefore?.profitBalance,
                        getLocalCurrency(item),
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceAfter?.capitalBalance,
                        getLocalCurrency(item),
                      )}
                    </td>

                    <td>
                      {formatAmount(
                        item.balanceAfter?.profitBalance,
                        getLocalCurrency(item),
                      )}
                    </td>

                    <td>
                      {item.account?.packageNameSnapshot ||
                        item.metadata?.packageNameSnapshot ||
                        "—"}
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
        </div>
      )}
    </div>
  );
}
