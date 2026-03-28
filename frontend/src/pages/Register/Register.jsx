import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";
import api from "../../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    country: "",
    promoCode: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    setError("");
    setSuccess("");

    // 🔥 VALIDATION (IMPORTANT)
    if (!acceptedTerms) {
      return setError("You must accept Terms & Conditions");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const response = await api.post("/user/register", {
        ...formData,
        acceptedTerms: true, // 🔥 send to backend
      });

      setSuccess(response.message || "Registration successful");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <Navbar />

      <section className="register-section">
        <div className="container register-layout">
          <div className="register-info">
            <h1>Create Your Account</h1>

            <p>
              Join Rebetas and access powerful AI-driven virtual football
              predictions to improve your betting strategy.
            </p>
          </div>

          <div className="register-card">
            <h2>Register</h2>

            <form className="register-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />

              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
              />

              <input
                type="text"
                name="promoCode"
                placeholder="Promo Code (Optional)"
                value={formData.promoCode}
                onChange={handleChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              {/* 🔥 TERMS CHECKBOX */}
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
              {success && <p style={{ color: "#22c55e" }}>{success}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="register-login">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
