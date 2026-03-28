import { useState } from "react";
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

  if (!isOpen || !wallet) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await api.post("/withdrawals", {
        amount: Number(amount),
        currency: wallet.currency,
      });

      setAmount("");
      onSuccess();
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

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="actions">
            <button type="button" onClick={onClose} className="cancel">
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || Number(amount) <= 0}
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
