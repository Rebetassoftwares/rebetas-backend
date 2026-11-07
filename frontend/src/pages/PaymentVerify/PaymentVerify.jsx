import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { trackEvent } from "../../services/tracking";

export default function PaymentVerify() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      try {
        const params = new URLSearchParams(window.location.search);

        // Flutterwave returns tx_ref.
        // Paystack returns reference.
        const reference =
          params.get("tx_ref") ||
          params.get("reference") ||
          params.get("trxref");

        if (!reference) {
          alert("Invalid payment reference");
          navigate("/pricing");
          return;
        }

        // Ask the backend to verify and activate the subscription.
        await api.post("/payments/verify", {
          reference,
        });

        if (!isMounted) return;

        const trackingKey = `sunstreamers_purchase_tracked_${reference}`;

        let alreadyTracked = false;

        try {
          alreadyTracked = localStorage.getItem(trackingKey) === "true";
        } catch (storageError) {
          console.warn(
            "Could not check purchase tracking status:",
            storageError,
          );
        }

        if (!alreadyTracked) {
          const trackingResult = trackEvent("Purchase", {
            content_name: "SunStreamers Subscription",
            content_category: "Subscription",
            transaction_id: reference,
          });

          const eventQueued = Object.values(trackingResult).some(
            (wasQueued) => wasQueued === true,
          );

          if (eventQueued) {
            try {
              localStorage.setItem(trackingKey, "true");
            } catch (storageError) {
              console.warn(
                "Could not save purchase tracking status:",
                storageError,
              );
            }
          }

          // Google Ads conversion will be sent here once the backend
          // returns the verified transaction amount and currency.
          //
          // Example:
          // trackGoogleAdsConversion({
          //   value: verifiedAmount,
          //   currency: verifiedCurrency,
          //   transactionId: reference,
          // });
        }

        alert("Payment successful 🎉");
        navigate("/dashboard");
      } catch (error) {
        console.error("Payment verification error:", error);

        if (!isMounted) return;

        alert("Payment verification failed");
        navigate("/pricing");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return <p style={{ color: "white" }}>Verifying payment...</p>;
}
