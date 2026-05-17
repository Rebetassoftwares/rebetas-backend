import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Pricing.css";

function CountryDropdown({ value, onChange, options, disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  function handleSelect(option) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div
      className={`pricing-dropdown ${disabled ? "disabled" : ""}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="pricing-dropdown-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span>{value || "Select Country"}</span>
        <span className={`pricing-dropdown-arrow ${open ? "open" : ""}`}>
          ⌄
        </span>
      </button>

      {open && (
        <div className="pricing-dropdown-menu">
          <button
            type="button"
            className={`pricing-dropdown-item ${value === "" ? "active" : ""}`}
            onClick={() => handleSelect("")}
          >
            Select Country
          </button>

          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={`pricing-dropdown-item ${
                value === option ? "active" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;

  const [pricing, setPricing] = useState([]);

  const [weeklyPlan, setWeeklyPlan] = useState("");
  const [monthlyPlan, setMonthlyPlan] = useState("");
  const [yearlyPlan, setYearlyPlan] = useState("");

  const [loadingPricing, setLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState("");

  const [subscribingPlan, setSubscribingPlan] = useState("");
  const [subscribeError, setSubscribeError] = useState("");

  const [basePromo, setBasePromo] = useState(null);
  const [calculatedPromos, setCalculatedPromos] = useState({});
  const [promoError, setPromoError] = useState("");
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [loadingPromoPlan, setLoadingPromoPlan] = useState("");

  const user = JSON.parse(localStorage.getItem("rebetas_user") || "{}");

  const promoCode =
    user?.promoCodeUsed || user?.promoCode || user?.activePromoCode || "";

  const FEATURES = [
    "Over 1.5 Goals Predictions",
    "Live Virtual Match Signals",
    "All Supported Platforms Access",
    "Fast Prediction Delivery",
    "No Ads Experience",
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadPricing() {
      try {
        setLoadingPricing(true);
        setPricingError("");

        const res = await api.get("/pricing");
        const data = res?.data ?? res;

        const pricingList = Array.isArray(data)
          ? data
          : Array.isArray(data?.pricing)
            ? data.pricing
            : [];

        if (isMounted) {
          setPricing(pricingList);
        }
      } catch (error) {
        if (isMounted) {
          setPricingError(error.message || "Failed to load pricing");
        }
      } finally {
        if (isMounted) {
          setLoadingPricing(false);
        }
      }
    }

    loadPricing();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBasePromo() {
      if (!promoCode) return;

      try {
        setLoadingPromo(true);
        setPromoError("");

        const res = await api.post("/promo/preview", {
          code: promoCode,
        });

        const data = res?.data ?? res;

        if (isMounted) {
          setBasePromo(data);
        }
      } catch {
        if (isMounted) {
          setBasePromo(null);
          setPromoError("");
        }
      } finally {
        if (isMounted) {
          setLoadingPromo(false);
        }
      }
    }

    loadBasePromo();

    return () => {
      isMounted = false;
    };
  }, [promoCode]);

  const countries = useMemo(() => {
    return pricing.map((item) => item.country);
  }, [pricing]);

  function getPricingByCountry(country) {
    return pricing.find((item) => item.country === country) || null;
  }

  function getPrice(country, type) {
    const data = getPricingByCountry(country);
    if (!data) return "";

    if (type === "weekly") return `${data.currency}${data.weeklyPrice}`;
    if (type === "monthly") return `${data.currency}${data.monthlyPrice}`;
    if (type === "yearly") return `${data.currency}${data.yearlyPrice}`;

    return "";
  }

  function getPromoFreeDays(plan) {
    return Number(
      basePromo?.freeDaysByPlan?.[plan] || basePromo?.freeDays || 0,
    );
  }

  function renderPromoBox(plan, country) {
    if (!promoCode || !basePromo) return null;

    const discountPercent = Number(basePromo?.discountPercent || 0);
    const freeDays = getPromoFreeDays(plan);
    const calculatedPromo = calculatedPromos?.[plan];

    if (discountPercent <= 0 && freeDays <= 0) return null;

    return (
      <div className="promo-box">
        <div className="promo-box-title">🎉 Promo code active</div>

        <div className="promo-code-line">
          Code: <strong>{promoCode}</strong>
        </div>

        {discountPercent > 0 && (
          <p>
            You have <strong>{discountPercent}% OFF</strong> on this {plan}{" "}
            plan.
          </p>
        )}

        <p>
          Extra access: <strong>{freeDays} extra days</strong>
        </p>

        {!country && (
          <p className="promo-muted">
            Select your country to see your discounted price.
          </p>
        )}

        {country && loadingPromoPlan === plan && (
          <p className="promo-muted">Calculating your discounted price...</p>
        )}

        {country && calculatedPromo?.originalPrice && (
          <div className="promo-price-breakdown">
            <p>
              Normal price:{" "}
              <s>
                {calculatedPromo.currency}
                {calculatedPromo.originalPrice}
              </s>
            </p>

            <p>
              Your price:{" "}
              <strong>
                {calculatedPromo.currency}
                {calculatedPromo.discountedPrice}
              </strong>
            </p>

            <p className="promo-save">
              You save {calculatedPromo.currency}
              {Number(
                calculatedPromo.savings ||
                  calculatedPromo.originalPrice -
                    calculatedPromo.discountedPrice,
              ).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    );
  }

  async function fetchPromo(plan, country) {
    setPromoError("");

    if (!promoCode || !plan || !country) return;

    try {
      setLoadingPromoPlan(plan);

      const res = await api.post("/promo/preview", {
        code: promoCode,
        plan,
        country,
      });

      const data = res?.data ?? res;

      setCalculatedPromos((prev) => ({
        ...prev,
        [plan]: data,
      }));
    } catch (err) {
      setCalculatedPromos((prev) => {
        const next = { ...prev };
        delete next[plan];
        return next;
      });

      setPromoError(err.message || "Promo error");
    } finally {
      setLoadingPromoPlan("");
    }
  }

  function subscribe(planType, country) {
    if (!country) {
      alert("Please select a country");
      return;
    }

    proceedPayment("flutterwave", planType, country);
  }

  async function proceedPayment(provider, planType, country) {
    const token = localStorage.getItem("rebetas_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setSubscribeError("");
      setSubscribingPlan(`${planType}_${country}`);

      const res = await api.post("/payments/initialize", {
        plan: planType,
        country,
        provider,
        promoCode: promoCode || "",
      });

      const data = res?.data ?? res;

      const paymentLink =
        data?.paymentData?.authorization_url || data?.paymentData?.link;

      if (!paymentLink) {
        throw new Error("Payment link not available");
      }

      window.location.href = paymentLink;
    } catch (error) {
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid session"
      ) {
        navigate("/login");
        return;
      }

      setSubscribeError(error.message || "Unable to initialize payment");
    } finally {
      setSubscribingPlan("");
    }
  }

  return (
    <div className="pricing-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <section className="pricing-hero">
        <div className="container">
          <h1>Pricing</h1>

          <p>Select your country and choose a plan.</p>

          {loadingPromo && promoCode && (
            <p className="promo-loading">Checking your promo code...</p>
          )}

          {pricingError && <p className="error-text">{pricingError}</p>}
          {subscribeError && <p className="error-text">{subscribeError}</p>}
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          {loadingPricing && <p className="info-text">Loading pricing...</p>}

          {!loadingPricing && pricing.length === 0 && (
            <p className="info-text">No pricing available yet.</p>
          )}

          {promoError && (
            <p className="error-text" style={{ textAlign: "center" }}>
              {promoError}
            </p>
          )}

          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Weekly Plan</h3>

              {renderPromoBox("weekly", weeklyPlan)}

              <CountryDropdown
                value={weeklyPlan}
                onChange={(value) => {
                  setWeeklyPlan(value);
                  fetchPromo("weekly", value);
                }}
                options={countries}
                disabled={loadingPricing}
              />

              <div className="price">
                {weeklyPlan && getPrice(weeklyPlan, "weekly")}
              </div>

              <ul className="features">
                {FEATURES.map((f, i) => (
                  <li key={i}>✔ {f}</li>
                ))}
              </ul>

              <button
                className="btn-outline"
                onClick={() => subscribe("weekly", weeklyPlan)}
                disabled={subscribingPlan === `weekly_${weeklyPlan}`}
              >
                {subscribingPlan === `weekly_${weeklyPlan}`
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>

            <div className="pricing-card highlight">
              <h3>Monthly Plan</h3>
              <div className="top-ribbon">BEST VALUE</div>
              <div className="best-badge">
                <span className="badge-icon">🔥</span>
                <span className="badge-text">MOST POPULAR</span>
              </div>

              {renderPromoBox("monthly", monthlyPlan)}

              <CountryDropdown
                value={monthlyPlan}
                onChange={(value) => {
                  setMonthlyPlan(value);
                  fetchPromo("monthly", value);
                }}
                options={countries}
                disabled={loadingPricing}
              />

              <div className="price">
                {monthlyPlan && getPrice(monthlyPlan, "monthly")}
              </div>

              <ul className="features">
                {FEATURES.map((f, i) => (
                  <li key={i}>✔ {f}</li>
                ))}
              </ul>

              <button
                className="btn-green"
                onClick={() => subscribe("monthly", monthlyPlan)}
                disabled={subscribingPlan === `monthly_${monthlyPlan}`}
              >
                {subscribingPlan === `monthly_${monthlyPlan}`
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>

            <div className="pricing-card">
              <h3>Yearly Plan</h3>

              {renderPromoBox("yearly", yearlyPlan)}

              <CountryDropdown
                value={yearlyPlan}
                onChange={(value) => {
                  setYearlyPlan(value);
                  fetchPromo("yearly", value);
                }}
                options={countries}
                disabled={loadingPricing}
              />

              <div className="price">
                {yearlyPlan && getPrice(yearlyPlan, "yearly")}
              </div>

              <ul className="features">
                {FEATURES.map((f, i) => (
                  <li key={i}>✔ {f}</li>
                ))}
              </ul>

              <button
                className="btn-green"
                onClick={() => subscribe("yearly", yearlyPlan)}
                disabled={subscribingPlan === `yearly_${yearlyPlan}`}
              >
                {subscribingPlan === `yearly_${yearlyPlan}`
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
