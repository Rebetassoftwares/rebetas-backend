import { useEffect, useState } from "react";
import api from "../services/api";

export default function usePrediction(league) {
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 🔥 FETCH PREDICTION
  useEffect(() => {
    if (!league) return;

    let isMounted = true;

    async function loadPrediction() {
      setLoadingPrediction(true);

      try {
        const res = await api.get(`/public/predictions/live/${league}`);
        if (isMounted) setPrediction(res || null);
      } catch (err) {
        console.error("Prediction load error:", err);
        if (isMounted) setPrediction(null);
      } finally {
        if (isMounted) setLoadingPrediction(false);
      }
    }

    loadPrediction();

    return () => {
      isMounted = false;
    };
  }, [league]);

  // 🔥 AUTO REFRESH (every 5s)
  useEffect(() => {
    if (!league) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/public/predictions/live/${league}`);
        setPrediction(Array.isArray(res) ? res[0] : res);
      } catch (err) {
        console.error("Auto refresh prediction error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [league]);

  // 🔥 COUNTDOWN (FIXED)
  useEffect(() => {
    if (!prediction?.scheduledFor) return;

    const interval = setInterval(() => {
      const now = new Date();
      const scheduled = new Date(prediction.scheduledFor);

      // ⚠️ TEMP fallback (until backend sends interval)
      const intervalMinutes = prediction?.intervalMinutes || 0;

      const next = new Date(scheduled.getTime() + intervalMinutes * 60 * 1000);

      const diff = Math.max(0, next - now);
      setCountdown(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [prediction]);

  return {
    prediction,
    loadingPrediction,
    countdown,
  };
}
