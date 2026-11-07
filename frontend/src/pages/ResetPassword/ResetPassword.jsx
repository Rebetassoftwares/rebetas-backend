import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(`/user/reset-password/${token}`, formData);

      setSuccess(res.message);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-password-page">
      <Navbar />

      <section className="reset-password-section">
        <div className="container">
          <div className="reset-password-card">
            <div className="reset-password-brand">
              <span className="reset-password-brand-mark">S</span>
              <span>SUNSTREAMERS</span>
            </div>

            <div className="reset-password-heading">
              <span className="reset-password-eyebrow">ACCOUNT SECURITY</span>

              <h1>Create a New Password</h1>

              <p className="reset-password-text">
                Set a new password to secure your SunStreamers account and
                continue accessing your prediction signals.
              </p>
            </div>

            <form className="reset-password-form" onSubmit={handleSubmit}>
              <div className="reset-password-field">
                <label htmlFor="new-password">New password</label>

                <div className="password-group">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-visibility"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 4.7 10 7-0.5 1.1-1.5 2.6-3.1 3.9M6.2 6.2C3.9 7.7 2.5 10 2 12c1 2.3 4.8 7 10 7 1.2 0 2.3-.2 3.3-.6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="reset-password-field">
                <label htmlFor="confirm-password">Confirm new password</label>

                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter your new password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <div className="reset-password-message error" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="reset-password-message success" role="status">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="reset-password-submit"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            <div className="reset-password-footer">
              <span>Remembered your password?</span>
              <button type="button" onClick={() => navigate("/login")}>
                Back to Login
              </button>
            </div>

            <p className="reset-password-security">
              Your account security matters. Keep your password private.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
