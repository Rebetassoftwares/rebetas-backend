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
              className={`pricing-dropdown-item ${value === option ? "active" : ""}`}
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

  const FEATURES = [
    "Over 1.5 Goals Predictions",
    "Live Virtual Match Signals",
    "All Supported Platforms Access",
    "Fast Prediction Delivery",
    "No Ads Experience",
  ];

  /* ---------------- LOAD PRICING ---------------- */

  useEffect(() => {
    let isMounted = true;

    async function loadPricing() {
      try {
        setLoadingPricing(true);
        setPricingError("");

        const res = await api.get("/pricing");

        // ✅ SAFE HANDLING (CRITICAL FIX)
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

  /* ---------------- HELPERS ---------------- */

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

  /* ---------------- PAYMENT ---------------- */

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
      });

      // ✅ SAFE RESPONSE HANDLING
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

      {/* HERO */}
      <section className="pricing-hero">
        <div className="container">
          <h1>Pricing</h1>

          <p>Select your country and choose a plan.</p>

          {pricingError && <p className="error-text">{pricingError}</p>}
          {subscribeError && <p className="error-text">{subscribeError}</p>}
        </div>
      </section>

      {/* ---------------- PRICING CARDS ---------------- */}

      <section className="pricing-section">
        <div className="container">
          {loadingPricing && <p className="info-text">Loading pricing...</p>}

          {!loadingPricing && pricing.length === 0 && (
            <p className="info-text">No pricing available yet.</p>
          )}

          <div className="pricing-grid">
            {/* WEEKLY */}
            <div className="pricing-card">
              <h3>Weekly Plan</h3>

              <CountryDropdown
                value={weeklyPlan}
                onChange={setWeeklyPlan}
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

            {/* MONTHLY */}
            <div className="pricing-card highlight">
              <h3>Monthly Plan</h3>

              <CountryDropdown
                value={monthlyPlan}
                onChange={setMonthlyPlan}
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

            {/* YEARLY */}
            <div className="pricing-card">
              <h3>Yearly Plan</h3>

              <CountryDropdown
                value={yearlyPlan}
                onChange={setYearlyPlan}
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
