import { useState, useEffect } from "react";
import api from "../services/api";
import "./WithdrawalModal.css";

export default function WithdrawalModal({
  isOpen,
  wallet,
  onClose,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [minAmount, setMinAmount] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // 🔥 NEW
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  /* ================= LOAD SETTINGS ================= */
  useEffect(() => {
    async function loadSettings() {
      try {
        setSettingsLoading(true);

        const settings = await api.get("/settings");

        const currency = wallet?.currency;

        let min = null;

        if (settings?.minWithdrawal) {
          if (typeof settings.minWithdrawal.get === "function") {
            min = settings.minWithdrawal.get(currency);
          } else {
            min = settings.minWithdrawal[currency];
          }
        }

        setMinAmount(typeof min === "number" ? min : 0);
      } catch (err) {
        console.error("Failed to load settings", err);
        setMinAmount(0);
      } finally {
        setSettingsLoading(false);
      }
    }

    if (wallet) loadSettings();
  }, [wallet]);

  /* ================= FEE PREVIEW ================= */
  useEffect(() => {
    async function fetchPreview() {
      const numericAmount = Number(amount);

      if (!numericAmount || numericAmount <= 0) {
        setPreview(null);
        return;
      }

      try {
        setPreviewLoading(true);

        const res = await api.post("/promo/withdrawals/preview", {
          amount: numericAmount,
          currency: wallet.currency,
        });

        setPreview(res);
      } catch (err) {
        console.error("Preview error:", err);
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }

    if (wallet) fetchPreview();
  }, [amount, wallet]);

  if (!isOpen || !wallet) return null;

  /* ================= SUBMIT ================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (wallet.pendingBalance > 0) {
      setError("You already have a pending withdrawal");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (minAmount > 0 && numericAmount < minAmount) {
      setError(`Minimum withdrawal is ${minAmount} ${wallet.currency}`);
      return;
    }

    if (numericAmount > wallet.balance) {
      setError("Insufficient balance");
      return;
    }

    // 🔥 Ensure valid payout after fees
    if (preview && preview.net <= 0) {
      setError("Amount too small after charges");
      return;
    }

    try {
      setLoading(true);

      await api.post("/promo/withdrawals", {
        amount: numericAmount,
        currency: wallet.currency,
      });

      setAmount("");
      onSuccess();

      alert("Withdrawal request submitted successfully");

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="withdraw-modal-overlay">
      <div className="withdraw-modal">
        <h2>Withdraw ({wallet.currency})</h2>

        <p className="balance">
          Available: <strong>{wallet.balance}</strong>
        </p>

        {/* SETTINGS */}
        {settingsLoading && <p className="note">Loading withdrawal rules...</p>}

        {!settingsLoading && minAmount > 0 && (
          <p className="note">
            Minimum withdrawal: {minAmount} {wallet.currency}
          </p>
        )}

        {/* WARNING */}
        {wallet.pendingBalance > 0 && (
          <p className="warning">You already have a pending withdrawal</p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {/* 🔥 FEE PREVIEW (NO MARKUP SHOWN) */}
          {previewLoading && <p className="note">Calculating charges...</p>}

          {preview && (
            <div className="fee-preview">
              <p>
                <strong>Total charges: {preview.totalFee}</strong>
              </p>

              <p>
                <strong>You will receive: {preview.net}</strong>
              </p>
            </div>
          )}

          <div className="actions">
            <button type="button" onClick={onClose} className="cancel">
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                settingsLoading ||
                previewLoading ||
                Number(amount) <= 0 ||
                Number(amount) > wallet.balance ||
                (minAmount > 0 && Number(amount) < minAmount) ||
                (preview && preview.net <= 0)
              }
              className="submit"
            >
              {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
