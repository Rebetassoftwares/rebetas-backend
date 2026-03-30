import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "../../../services/adminApi";
import { formatMoney } from "../../../utils/currency";
import "./UserDetail.css";

export default function UserDetail() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div className="user-detail-page">
      <h2>User Details</h2>

      {/* PROFILE */}
      <div className="card">
        <h3>Profile</h3>

        <p>
          <strong>Name:</strong> {user.fullName}
        </p>
        <p>
          <strong>Username:</strong> @{user.username}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone || "N/A"}
        </p>
        <p>
          <strong>Country:</strong> {user.country}
        </p>
        <p>
          <strong>Status:</strong> {user.accountStatus}
        </p>
      </div>

      {/* SUBSCRIPTION */}
      <div className="card">
        <h3>Subscription</h3>

        {user.subscription ? (
          <>
            <p>
              <strong>Plan:</strong> {user.subscription.plan}
            </p>
            <p>
              <strong>Status:</strong> {user.subscription.status}
            </p>
            <p>
              <strong>Ends:</strong>{" "}
              {new Date(user.subscription.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              {formatMoney(
                user.subscription.currency,
                user.subscription.amount,
              )}
            </p>
          </>
        ) : (
          <p>No active subscription</p>
        )}
      </div>
    </div>
  );
}
