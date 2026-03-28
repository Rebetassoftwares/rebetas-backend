import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import api from "../../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function verify() {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await api.get(
          `/user/verify-email?token=${encodeURIComponent(token)}`,
        );

        setStatus("success");
        setMessage(response.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Email verification failed.");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <div className="login-page">
      <Navbar />

      <section className="login-section">
        <div className="container login-layout">
          <div className="login-info">
            <h1>Email Verification</h1>
            <p>{message}</p>
          </div>

          <div className="login-card">
            <h2>{status === "success" ? "Verified" : "Verification Status"}</h2>

            {status === "loading" && <p>Processing...</p>}

            {status === "success" && (
              <p className="login-register">
                You can now <Link to="/login">login</Link>.
              </p>
            )}

            {status === "error" && (
              <p className="login-register">
                Go back to <Link to="/register">register</Link>.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
