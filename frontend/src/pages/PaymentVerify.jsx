import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PaymentVerify() {
  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      try {
        const params = new URLSearchParams(window.location.search);
        const tx_ref = params.get("tx_ref");

        if (!tx_ref) {
          alert("Invalid payment reference");
          return navigate("/pricing");
        }

        await api.post("/payments/verify", {
          reference: tx_ref,
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
