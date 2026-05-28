import { useState } from "react";
import { applyDailyProfitCredit } from "../../../services/adminApi";
import "./AdminDailyProfitCredit.css";

const BASE_CURRENCY = "USD";

export default function AdminDailyProfitCredit() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatAmount(value, currency = "") {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }

  async function handleApplyCredit() {
    if (
      !window.confirm(
        "Apply Daily Profit Credit to all eligible active AutoPilot accounts?",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await applyDailyProfitCredit();

      setResult(res?.data || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to apply Daily Profit Credit");
    } finally {
      setLoading(false);
    }
  }

  const creditedAccounts = result?.creditedAccounts || [];
  const baseCurrency = result?.baseCurrency || BASE_CURRENCY;

  return (
    <div className="daily-profit-page">
      <div className="daily-profit-header">
        <div>
          <h2>💜 Daily Profit Credit</h2>
          <p>
            Apply daily Profit Credit to eligible active AutoPilot accounts.
            Admin totals are tracked in USD while users receive local currency
            credit.
          </p>
        </div>
      </div>

      {error && <div className="daily-profit-error">{error}</div>}

      <div className="daily-profit-warning">
        <h3>Important Notice</h3>

        <p>
          This action will credit Profit Balance for all active AutoPilot
          accounts that are eligible for today. The system uses each account’s
          Package daily return percentage.
        </p>

        <p>
          Accounts already credited today will be skipped automatically by the
          backend. Accounts without a valid exchange rate snapshot will also be
          skipped for finance safety.
        </p>

        <button disabled={loading} onClick={handleApplyCredit}>
          {loading ? "Applying Profit Credit..." : "Apply Daily Profit Credit"}
        </button>
      </div>

      {result && (
        <>
          <div className="daily-profit-summary">
            <div className="summary-card">
              <span>Credited Accounts</span>
              <h3>{result.creditedCount || 0}</h3>
            </div>

            <div className="summary-card">
              <span>Skipped Accounts</span>
              <h3>{result.skippedCount || 0}</h3>
            </div>

            <div className="summary-card">
              <span>Missing Exchange Rates</span>
              <h3>{result.missingExchangeRateCount || 0}</h3>
            </div>

            <div className="summary-card">
              <span>Total Profit Credited</span>

              <div className="money-stack">
                <strong>
                  {formatAmount(result.totalBaseProfitCredited, baseCurrency)}
                </strong>

                <small>
                  Local total: {formatAmount(result.totalProfitCredited)}
                </small>
              </div>
            </div>
          </div>

          <div className="daily-profit-table-card">
            <h3>Credited Accounts</h3>

            {creditedAccounts.length === 0 ? (
              <div className="daily-profit-empty">
                No accounts were credited.
              </div>
            ) : (
              <div className="daily-profit-table-wrapper">
                <table className="daily-profit-table">
                  <thead>
                    <tr>
                      <th>Account ID</th>
                      <th>User ID</th>
                      <th>Package</th>
                      <th>Capital Balance</th>
                      <th>Capital USD</th>
                      <th>Daily Return %</th>
                      <th>Profit Credited</th>
                      <th>Profit USD</th>
                      <th>Exchange Rate</th>
                      <th>Currency</th>
                    </tr>
                  </thead>

                  <tbody>
                    {creditedAccounts.map((item, index) => (
                      <tr key={item.accountId || index}>
                        <td>{item.accountId}</td>
                        <td>{item.userId}</td>
                        <td>{item.packageName || "Package"}</td>

                        <td>
                          {formatAmount(item.capitalBalance, item.currency)}
                        </td>

                        <td>
                          {formatAmount(
                            item.baseCapitalBalance,
                            item.baseCurrency || baseCurrency,
                          )}
                        </td>

                        <td>{item.dailyReturnPercentage}%</td>

                        <td>
                          {formatAmount(item.profitCredited, item.currency)}
                        </td>

                        <td>
                          {formatAmount(
                            item.baseProfitCredited,
                            item.baseCurrency || baseCurrency,
                          )}
                        </td>

                        <td>
                          {item.exchangeRateSnapshot
                            ? `1 ${item.baseCurrency || baseCurrency} = ${Number(
                                item.exchangeRateSnapshot,
                              ).toLocaleString()} ${item.currency}`
                            : "—"}
                        </td>

                        <td>{item.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
