import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserById,
  updateUserStatus,
  resetUserDevice,
} from "../../../services/adminApi";
import { formatMoney } from "../../../utils/currency";
import "./UserDetail.css";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getUserById(id);
      setUser(res);
    } catch (err) {
      console.error(err);
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleStatus(status) {
    try {
      setActionLoading(true);
      await updateUserStatus(id, status);
      await loadUser();
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReset() {
    try {
      setActionLoading(true);
      await resetUserDevice(id);
      alert("Device reset successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to reset device");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="admin-error">{error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div className="user-detail-page">
      {/* HEADER */}
      <div className="user-header">
        <button className="back-btn" onClick={() => navigate("/admin/users")}>
          ← Back
        </button>

        <div>
          <h2>{user.fullName}</h2>
          <p>@{user.username}</p>
        </div>

        <span className={`status-badge ${user.accountStatus}`}>
          {user.accountStatus}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="actions-bar">
        <button onClick={() => handleStatus("active")} disabled={actionLoading}>
          Activate
        </button>
        <button
          onClick={() => handleStatus("suspended")}
          disabled={actionLoading}
        >
          Suspend
        </button>
        <button onClick={() => handleStatus("banned")} disabled={actionLoading}>
          Ban
        </button>
        <button onClick={handleReset} disabled={actionLoading}>
          Reset Device
        </button>
      </div>

      {/* PROFILE */}
      <div className="card">
        <h3>Profile</h3>

        <div className="grid">
          <div>
            <span>Name</span>
            <strong>{user.fullName}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{user.phone || "N/A"}</strong>
          </div>

          <div>
            <span>Country</span>
            <strong>{user.country}</strong>
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION */}
      <div className="card">
        <h3>Subscription</h3>

        {user.subscription ? (
          <div className="grid">
            <div>
              <span>Plan</span>
              <strong>{user.subscription.plan}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{user.subscription.status}</strong>
            </div>

            <div>
              <span>Ends</span>
              <strong>
                {new Date(user.subscription.endDate).toLocaleDateString()}
              </strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>
                {formatMoney(
                  user.subscription.currency,
                  user.subscription.amount,
                )}
              </strong>
            </div>
          </div>
        ) : (
          <p>No active subscription</p>
        )}
      </div>
    </div>
  );
}
