import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./PromoDetails.css";
import { getPromoDetails } from "../../../services/adminApi";

export default function PromoDetails() {
  const { id } = useParams();

  const [promo, setPromo] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [earnings, setEarnings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- LOAD DETAILS ---------------- */

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getPromoDetails(id);
      const data = res?.data || res || {};

      setPromo(data.promo || null);
      setWallets(Array.isArray(data.wallets) ? data.wallets : []);
      setEarnings(Array.isArray(data.earnings) ? data.earnings : []);
    } catch (err) {
      console.error(
        "DETAIL ERROR:",
        err?.response?.data || err?.message || err,
      );
      setError(err?.response?.data?.message || "Failed to load promo details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* ---------------- EFFECT ---------------- */

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="promo-details-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="promo-details-page">
        <p>{error}</p>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="promo-details-page">
        <p>No data</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="promo-details-page">
      <h2>{promo.code} Details</h2>

      {/* INFO */}
      <div className="promo-info">
        <p>
          <strong>Owner:</strong> {promo.ownerName || "N/A"}
        </p>

        <p>
          <strong>Commission:</strong> {promo.commissionPercent || 0}%
        </p>

        <p>
          <strong>Status:</strong> {promo.active ? "Active" : "Inactive"}
        </p>

        <p>
          <strong>Total Usage:</strong> {promo.usageCount || 0}
        </p>

        {/* 🔥 NEW SECTION: BENEFITS */}

        <div className="promo-benefits">
          <h4>Benefits</h4>

          {promo.discountPercent > 0 && (
            <p>
              <strong>Discount:</strong> {promo.discountPercent}%
            </p>
          )}

          {(promo.freeDays > 0 || promo.freeWeeks > 0) && (
            <p>
              <strong>Free Time:</strong> {promo.freeDays || 0} days /{" "}
              {promo.freeWeeks || 0} weeks
            </p>
          )}

          {promo.discountPercent === 0 &&
            promo.freeDays === 0 &&
            promo.freeWeeks === 0 && <p>No additional benefits</p>}
        </div>

        {/* 🔥 USAGE LIMIT */}

        <p>
          <strong>Max Uses Per User:</strong> {promo.maxUsesPerUser || 1}
        </p>
      </div>

      {/* WALLETS */}
      <div className="wallet-section">
        <h3>Wallet Balances</h3>

        {wallets.length === 0 ? (
          <p>No earnings yet</p>
        ) : (
          <div className="wallet-grid">
            {wallets.map((w, i) => (
              <div key={w?.currency || i} className="wallet-card">
                <div className={`currency-tag currency-${w?.currency}`}>
                  {w?.currency || "N/A"}
                </div>

                <p>
                  Balance: {w?.currency}{" "}
                  {Number(w?.balance || 0).toLocaleString()}
                </p>

                <p>
                  Earned: {w?.currency}{" "}
                  {Number(w?.totalEarned || 0).toLocaleString()}
                </p>

                <p>
                  Withdrawn: {w?.currency}{" "}
                  {Number(w?.totalWithdrawn || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EARNINGS */}
      <div className="earnings-section">
        <h3>Earnings History</h3>

        {earnings.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          <div className="earnings-table">
            <div className="table-head">
              <span>User</span>
              <span>Amount</span>
              <span>Commission</span>
              <span>Currency</span>
              <span>Date</span>
            </div>

            {earnings.map((e) => (
              <div key={e._id} className="table-row">
                <span>{e?.subscribedUserId?.fullName || "N/A"}</span>

                <span>
                  {e?.currency} {Number(e?.amount || 0).toLocaleString()}
                </span>

                <span>
                  {e?.currency}{" "}
                  {Number(e?.commissionAmount || 0).toLocaleString()}
                </span>

                <span>{e?.currency || "-"}</span>

                <span>
                  {e?.createdAt
                    ? new Date(e.createdAt).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
