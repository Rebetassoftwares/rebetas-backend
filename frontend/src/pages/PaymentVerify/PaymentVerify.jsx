import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PaymentVerify() {
  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      try {
        const params = new URLSearchParams(window.location.search);

        // Flutterwave returns tx_ref
        // Paystack returns reference
        const reference =
          params.get("tx_ref") ||
          params.get("reference") ||
          params.get("trxref");

        if (!reference) {
          alert("Invalid payment reference");
          navigate("/pricing");
          return;
        }

        await api.post("/payments/verify", {
          reference,
        });

        alert("Payment successful 🎉");
        navigate("/dashboard");
      } catch (error) {
        console.error(error);
        alert("Payment verification failed");
        navigate("/pricing");
      }
    }

    verify();
  }, [navigate]);

  return <p style={{ color: "white" }}>Verifying payment...</p>;
}
