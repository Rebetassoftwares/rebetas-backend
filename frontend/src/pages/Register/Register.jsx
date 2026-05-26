import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { COUNTRIES } from "../../data/countries";
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
    countryIsoCode: "",
    countryDialCode: "+44",
    currency: "",

    promoCode: "",
    password: "",
    confirmPassword: "",
  });

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [promoPreview, setPromoPreview] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function selectCountry(c) {
    setFormData((prev) => ({
      ...prev,
      country: c.name,
      countryIsoCode: c.code,
      countryDialCode: c.dial,
      currency: c.currency,
    }));

    setShowDropdown(false);
    setSearch("");
  }

  async function handlePromoPreview(code) {
    if (!code || code.trim().length < 2) {
      setPromoPreview(null);
      setPromoError("");
      return;
    }

    try {
      setCheckingPromo(true);

      const res = await api.post("/promo/preview", { code });

      setPromoPreview(res);
      setPromoError("");
    } catch (err) {
      setPromoPreview(null);
      setPromoError(err.message || "Invalid promo code");
    } finally {
      setCheckingPromo(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!acceptedTerms) {
      return setError("You must accept Terms & Conditions");
    }

    if (!formData.country || !formData.countryIsoCode || !formData.currency) {
      return setError("Please select your country.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const fullPhone = `${formData.countryDialCode}${formData.phone}`;

      const response = await api.post("/user/register", {
        ...formData,
        phone: fullPhone,
        acceptedTerms: true,
      });

      setSuccess(response.message || "Registration successful");

      setTimeout(() => navigate("/login"), 1500);
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
              predictions.
            </p>
          </div>

          <div className="register-card">
            <h2>Register</h2>

            <form className="register-form" onSubmit={handleSubmit}>
              <input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />

              <input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />

              <input
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />

              <div className="phone-group">
                <div
                  className="country-selector"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {formData.countryIsoCode && (
                    <ReactCountryFlag
                      countryCode={formData.countryIsoCode}
                      svg
                      style={{ width: "20px", height: "20px" }}
                    />
                  )}

                  <span>{formData.countryDialCode}</span>
                </div>

                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />

                {showDropdown && (
                  <div className="country-dropdown">
                    <input
                      placeholder="Search country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="country-list">
                      {filteredCountries.map((c) => (
                        <div
                          key={c.code}
                          className="country-item"
                          onClick={() => selectCountry(c)}
                        >
                          <ReactCountryFlag
                            countryCode={c.code}
                            svg
                            style={{ width: "20px", height: "20px" }}
                          />

                          <span>{c.name}</span>
                          <span>{c.dial}</span>
                          <span>{c.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                name="country"
                placeholder="Country"
                value={formData.country}
                readOnly
              />

              <input
                name="currency"
                placeholder="Currency"
                value={formData.currency}
                readOnly
              />

              <div className="password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />

                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>

              <div className="password-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />

                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div>

              <input
                name="promoCode"
                placeholder="Promo Code"
                value={formData.promoCode}
                onChange={(e) => {
                  handleChange(e);
                  handlePromoPreview(e.target.value);
                }}
              />

              {checkingPromo && (
                <p style={{ color: "#a855f7" }}>Checking promo...</p>
              )}

              {promoPreview && promoPreview.valid && (
                <div className="promo-preview success">
                  <div className="promo-title">🎉 Promo code applied!</div>

                  {promoPreview.discountPercent > 0 && (
                    <div className="promo-line">
                      You get{" "}
                      <strong>{promoPreview.discountPercent}% discount</strong>{" "}
                      on your subscription.
                    </div>
                  )}

                  <div className="promo-line">Extra access days:</div>

                  <div className="promo-days">
                    <span>
                      Weekly: {promoPreview.freeDaysByPlan?.weekly || 0} extra
                      days
                    </span>

                    <span>
                      Monthly: {promoPreview.freeDaysByPlan?.monthly || 0} extra
                      days
                    </span>

                    <span>
                      Yearly: {promoPreview.freeDaysByPlan?.yearly || 0} extra
                      days
                    </span>
                  </div>
                </div>
              )}

              {promoError && <p style={{ color: "#ff6b6b" }}>{promoError}</p>}

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />

                <span>
                  I agree to <Link to="/terms">Terms</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>
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
