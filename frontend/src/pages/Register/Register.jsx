import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef } from "react";
import ReactCountryFlag from "react-country-flag";
import { COUNTRIES } from "../../data/countries";
import "./Register.css";
import api from "../../services/api";
import { trackEvent } from "../../services/tracking";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralFromLink = searchParams.get("ref");

  const registrationStarted = useRef(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    country: "",
    countryIsoCode: "",
    countryDialCode: "+44",
    currency: "",
    referralCode: referralFromLink || "",
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

  function handleRegistrationStart() {
    if (registrationStarted.current) return;

    registrationStarted.current = true;

    trackEvent("Lead", {
      content_name: "SunStreamers Registration",
    });
  }

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

      trackEvent("CompleteRegistration", {
        content_name: "SunStreamers Account Registration",
      });

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
            <span className="register-eyebrow">JOIN SUNSTREAMERS</span>

            <h1>
              Your Next Move
              <span> Starts Here.</span>
            </h1>

            <p>
              Create your SunStreamers account and get access to our 24-hour
              virtual football prediction signal experience. Explore available
              signals, access your account dashboard and take control of your
              betting decisions.
            </p>

            <div className="register-benefits">
              <div className="register-benefit">
                <span className="register-benefit-icon">✓</span>
                <span>Access your personal dashboard</span>
              </div>

              <div className="register-benefit">
                <span className="register-benefit-icon">✓</span>
                <span>Explore available virtual football signals</span>
              </div>

              <div className="register-benefit">
                <span className="register-benefit-icon">✓</span>
                <span>Manage your account and subscription</span>
              </div>
            </div>

            <div className="register-performance">
              <strong>85%</strong>
              <div>
                <span>Reported winning rate</span>
              </div>
            </div>
          </div>

          <div className="register-card">
            <div className="register-card-heading">
              <span className="register-card-kicker">CREATE YOUR ACCOUNT</span>
              <h2>Get Started</h2>
              <p>Enter your details to create your SunStreamers account.</p>
            </div>

            <form
              className="register-form"
              onSubmit={handleSubmit}
              onFocusCapture={handleRegistrationStart}
            >
              <div className="register-field">
                <label htmlFor="register-username">Username</label>
                <input
                  id="register-username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-fullname">Full name</label>
                <input
                  id="register-fullname"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="register-field">
                <label htmlFor="register-phone">Phone number</label>
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
                    <span className="country-selector-arrow">⌄</span>
                  </div>

                  <input
                    id="register-phone"
                    type="text"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel-national"
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
              </div>

              <div className="register-two-column">
                <div className="register-field">
                  <label htmlFor="register-country">Country</label>
                  <input
                    id="register-country"
                    name="country"
                    placeholder="Select country above"
                    value={formData.country}
                    readOnly
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-currency">Currency</label>
                  <input
                    id="register-currency"
                    name="currency"
                    placeholder="Currency"
                    value={formData.currency}
                    readOnly
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-password">Password</label>
                <div className="password-group">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <span onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>
                <div className="password-group">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Enter your password again"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <div className="register-two-column">
                <div className="register-field">
                  <label htmlFor="register-referral">Referral code</label>
                  <input
                    id="register-referral"
                    name="referralCode"
                    placeholder="Referral code"
                    value={formData.referralCode}
                    readOnly={!!referralFromLink}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referralCode: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-promo">Promo code</label>
                  <input
                    id="register-promo"
                    name="promoCode"
                    placeholder="Promo code"
                    value={formData.promoCode}
                    onChange={(e) => {
                      handleChange(e);
                      handlePromoPreview(e.target.value);
                    }}
                  />
                </div>
              </div>

              {checkingPromo && (
                <p className="promo-feedback">Checking promo code...</p>
              )}

              {promoPreview && promoPreview.valid && (
                <div className="promo-preview success">
                  <div className="promo-title">Promo code applied</div>

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

              {promoError && <p className="register-error">{promoError}</p>}

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

              {error && <p className="register-error">{error}</p>}
              {success && <p className="register-success">{success}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create My Account"}
                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="register-login">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
