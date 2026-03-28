import { useEffect, useState } from "react";
import { getPayments } from "../../../services/adminApi";
import "./Payments.css";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const res = await getPayments();

      // ✅ SAFE HANDLING
      if (Array.isArray(res)) {
        setPayments(res);
      } else {
        console.warn("Unexpected payments response:", res);
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load payments");
      setPayments([]); // ✅ prevent crash
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className="payments-page">
      <h2>Payments</h2>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        <div className="payments-table">
          <div className="table-head">
            <span>User</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {payments.map((p) => (
            <div key={p._id} className="table-row">
              <span>{p.userId || "N/A"}</span>

              <span>₦ {p.amount?.toLocaleString?.() || 0}</span>

              <span
                className={`status ${
                  p.status === "success" ? "success" : "failed"
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
