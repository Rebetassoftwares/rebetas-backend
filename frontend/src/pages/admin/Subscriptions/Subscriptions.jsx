import { useEffect, useState } from "react";
import {
  getSubscriptions,
  cancelSubscription,
} from "../../../services/adminApi";
import "./Subscriptions.css";

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubscriptions() {
    try {
      setLoading(true);
      setError("");

      const res = await getSubscriptions();

      // ✅ SAFE HANDLING
      if (Array.isArray(res)) {
        setSubs(res);
      } else {
        console.warn("Unexpected subscriptions response:", res);
        setSubs([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load subscriptions");
      setSubs([]); // prevent crash
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

  return (
    <div className="subs-page">
      <h2>Subscriptions</h2>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : subs.length === 0 ? (
        <p>No subscriptions found</p>
      ) : (
        <div className="subs-table">
          <div className="table-head">
            <span>User</span>
            <span>Plan</span>
            <span>Status</span>
            <span>End Date</span>
            <span>Action</span>
          </div>

          {subs.map((s) => (
            <div key={s._id} className="table-row">
              <span>{s.userId || "N/A"}</span>

              <span>{s.plan || "N/A"}</span>

              <span
                className={`status ${
                  s.status === "active" ? "active" : "cancelled"
                }`}
              >
                {s.status || "unknown"}
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
