import Navbar from "../../components/Navbar/Navbar";
import { Link } from "react-router-dom";
import "./Landing.css";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import Footer from "../../components/Footer/Footer";

import "swiper/css";
import "swiper/css/pagination";

import { useState, useEffect, useMemo } from "react";

import api from "../../services/api";

import heroBg from "../../assets/hero_sport.jpg";
import { getImageUrl } from "../../utils/getImageUrl";

import predictionScreen from "../../assets/prediction-screen.png";

import autoUpdateIcon from "../../assets/autoupdate.png";
import atmImage from "../../assets/atm-betting.jpg";
import videoTutorial from "../../assets/video-tutorial.jpg";
import timeMoney from "../../assets/time-money.jpg";

export default function Landing() {
  /* -------------------------
     PLATFORM / LEAGUE STATE
  --------------------------*/

  const [platforms, setPlatforms] = useState([]);
  const [platformId, setPlatformId] = useState("");
  const [leagueOptions, setLeagueOptions] = useState([]);
  const [league, setLeague] = useState("");

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString()}`;
  };

  /* -------------------------
     FILTER STATE
  --------------------------*/

  const [timeframe, setTimeframe] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const selectedLeague = leagueOptions.find((item) => item._id === league);

  const platformKey = selectedLeague?.platformId?.name?.toLowerCase();
  const leagueKey = selectedLeague?.leagueName;

  const platformName = selectedLeague?.platformId?.name || "";

  /* -------------------------
     LOAD LEAGUES
  --------------------------*/

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const res = await api.get("/platforms");

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        setPlatforms(data);

        if (data.length > 0) {
          setPlatformId(data[0]._id); // 🔥 THIS IS KEY
        }
      } catch (err) {
        console.error("Platform load error:", err);
      }
    }

    loadPlatforms();
  }, []);

  useEffect(() => {
    if (!platformId) return;

    async function loadLeagues() {
      try {
        const response = await api.get(
          `/manual-leagues?platformId=${platformId}`,
        );

        const leagues = Array.isArray(response) ? response : [];

        setLeagueOptions(leagues);

        if (leagues.length > 0) {
          setLeague(leagues[0]._id);
        }
      } catch (error) {
        console.error("League load error:", error);
      }
    }

    loadLeagues();
  }, [platformId]);

  /* -------------------------
     LOAD HISTORY
  --------------------------*/

  useEffect(() => {
    if (!league || !platformKey || !leagueKey) return;

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const response = await api.get(`/history/${platformKey}/${leagueKey}`);

        setHistory(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("History load error:", error);
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [league, platformKey, leagueKey]);

  useEffect(() => {
    if (!league || !platformKey || !leagueKey) return;

    const interval = setInterval(() => {
      (async () => {
        try {
          const response = await api.get(
            `/history/${platformKey}/${leagueKey}`,
          );

          setHistory(Array.isArray(response) ? response : []);
        } catch (error) {
          console.error("Auto refresh error:", error);
        }
      })();
    }, 5000);

    return () => clearInterval(interval);
  }, [league, platformKey, leagueKey]);

  /* -------------------------
     FILTERED DATA
  --------------------------*/

  const filteredPredictions = useMemo(() => {
    let data = [...history];

    if (timeframe === "week" && selectedWeek !== "all") {
      data = data.filter((item) => String(item.week) === selectedWeek);
    }

    if (timeframe === "month" && selectedMonth !== "all") {
      data = data.filter((item) => item.month === selectedMonth);
    }

    if (timeframe === "custom" && customStartDate && customEndDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);

        return (
          itemDate >= new Date(customStartDate) &&
          itemDate <= new Date(customEndDate)
        );
      });
    }

    return data;
  }, [
    history,
    timeframe,
    selectedWeek,
    selectedMonth,
    customStartDate,
    customEndDate,
  ]);

  /* -------------------------
     SUMMARY
  --------------------------*/

  const summary = useMemo(() => {
    const totalBets = filteredPredictions.length;

    const totalReturns = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.resultAmount || 0),
      0,
    );

    const totalProfit = filteredPredictions.reduce(
      (sum, item) => sum + Number(item.profit || 0),
      0,
    );

    let openingBalance = 0;
    let closingBalance = 0;

    if (filteredPredictions.length > 0) {
      const oldest = filteredPredictions[filteredPredictions.length - 1];
      const latest = filteredPredictions[0];

      openingBalance =
        Number(oldest.capitalAfter || 0) - Number(oldest.profit || 0);

      closingBalance = Number(latest.capitalAfter || 0);
    }

    let roi = 0;
    if (openingBalance > 0) {
      roi = (totalProfit / openingBalance) * 100;
    }

    return {
      totalBets,
      openingBalance,
      closingBalance,
      totalReturns,
      totalProfit,
      roi,
    };
  }, [filteredPredictions]);

  const availableWeeks = [
    ...new Set(history.map((item) => item.week).filter(Boolean)),
  ];

  const availableMonths = [
    ...new Set(history.map((item) => item.month).filter(Boolean)),
  ];

  return (
    <div className="landing-page">
      <Navbar />

      {/* HERO */}

      <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>

        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-label">AI VIRTUAL FOOTBALL PREDICTIONS</span>

            <h1>Win Virtual Football With Ease</h1>

            <p>
              Rebetas analyzes virtual match patterns and probability models to
              generate high-confidence predictions for supported betting
              platforms.
            </p>

            <Link to="/register" className="hero-primary">
              Get Started
            </Link>
          </div>

          <div className="hero-platforms-area">
            <p className="platform-title">
              Bet on your favorite virtual sports platform
            </p>

            <div className="hero-platforms">
              {platforms.map((p) => (
                <img
                  key={p._id}
                  src={getImageUrl(p.logo)}
                  alt={p.name}
                  onClick={() => setPlatformId(p._id)}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  style={{
                    cursor: "pointer",
                    opacity: platformId === p._id ? 1 : 0.6,
                    transform:
                      platformId === p._id ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </div>
            <div className="league-bar">
              {leagueOptions.map((item) => (
                <button
                  key={item._id}
                  className={
                    league === item._id ? "league-btn active" : "league-btn"
                  }
                  onClick={() => setLeague(item._id)}
                >
                  {item.leagueName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PREDICTION PERFORMANCE */}

      <div className="history-section">
        <div className="history-header">
          <h2>Prediction Performance</h2>
          <span className="history-filter">
            {platformName} - {leagueKey}
          </span>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Time Frame</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {timeframe === "week" && (
            <div className="filter-group">
              <label>Select Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option value="all">All Weeks</option>
                {availableWeeks.map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
          )}

          {timeframe === "month" && (
            <div className="filter-group">
              <label>Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          )}

          {timeframe === "custom" && (
            <>
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="summary-table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Number of Bets</th>
                <th>Opening Balance</th>
                <th>Closing Balance</th>
                <th>Total Returns</th>
                <th>Total Profit</th>
                <th>ROI (%)</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{summary.totalBets}</td>

                <td className="result-neutral">
                  {formatCurrency(summary.openingBalance)}
                </td>

                <td className="result-neutral">
                  {formatCurrency(summary.closingBalance)}
                </td>

                <td
                  className={
                    summary.totalReturns >= summary.openingBalance
                      ? "result-win"
                      : "result-loss"
                  }
                >
                  {formatCurrency(summary.totalReturns)}
                </td>

                <td
                  className={
                    summary.totalProfit >= 0 ? "result-win" : "result-loss"
                  }
                >
                  {summary.totalProfit >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(summary.totalProfit))}
                </td>

                <td className={summary.roi >= 0 ? "result-win" : "result-loss"}>
                  {summary.roi >= 0 ? "+" : ""}
                  {Number(summary.roi || 0).toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-scroll-box">
          <table className="past-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Week</th>
                <th>Match</th>
                <th>Odd</th>
                <th>Stake</th>
                <th>Result</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    Loading history...
                  </td>
                </tr>
              ) : filteredPredictions.length > 0 ? (
                filteredPredictions.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{item.week || "-"}</td>
                    <td>{item.match || "-"}</td>
                    <td>{item.odd ?? "-"}</td>

                    <td className="result-outgoing">
                      {formatCurrency(item.stake)}
                    </td>

                    <td
                      className={
                        item.resultStatus === "WIN"
                          ? "result-win"
                          : "result-loss"
                      }
                    >
                      {formatCurrency(item.resultAmount)}
                    </td>

                    <td
                      className={
                        Number(item.profit || 0) >= 0
                          ? "result-win"
                          : "result-loss"
                      }
                    >
                      {Number(item.profit || 0) >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(item.profit))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No prediction history found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ABOUT / WHO WE ARE */}

      <section className="about-section">
        <div className="container">
          <div className="about-header">
            <div className="about-left">
              <span className="section-tag">WHO WE ARE</span>

              <h2>About Rebetas Virtual Football Prediction Software</h2>
            </div>

            <div className="about-right">
              <p>
                Rebetas virtual football prediction software uses advanced AI
                algorithms to analyze match patterns and generate reliable
                virtual football predictions. Our system continuously improves
                its models using updated virtual league data, helping you make
                smarter betting decisions consistently.
              </p>
            </div>
          </div>

          {/* INDICATOR CARDS */}

          <div className="indicator-grid">
            <div className="indicator-card">
              <h3>Rebetas Free Virtual Football Indicator</h3>

              <p>
                As a beginner you can start with our free virtual football
                indicator. This allows you to observe prediction patterns and
                learn how the system performs before upgrading.
              </p>

              <button className="indicator-btn">Use For Free</button>
            </div>

            <div className="indicator-card">
              <h3>Rebetas Premium Virtual Football Indicator</h3>

              <p>
                Premium users receive predictions earlier before matches start,
                giving more time to prepare bets and take advantage of
                profitable opportunities.
              </p>

              <button className="indicator-btn">Subscribe To Use</button>
            </div>

            <div className="indicator-card">
              <h3>Rebetas Ultra Virtual Football Indicator</h3>

              <p>
                Our ultra indicator integrates with automated betting strategies
                and provides the most advanced prediction capabilities for
                serious bettors.
              </p>

              <button className="indicator-btn">Subscribe To Use</button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY REBETAS */}

      <section className="why-section">
        <div className="why-container">
          <div className="why-content">
            <span className="section-tag">WHY REBETAS?</span>

            <h2>Why you need the Rebetas Prediction software</h2>

            <p>
              At the beginning of every virtual football match our AI analyzes
              patterns, historical probabilities and match simulations to
              identify the most profitable outcomes. Rebetas helps you place
              smarter bets consistently without guessing.
            </p>

            <button className="why-btn">Read More</button>
          </div>

          <div className="why-image">
            <img src={predictionScreen} alt="Rebetas Prediction Software" />
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section className="features-section">
        <div className="container">
          <span className="section-tag">FEATURES</span>

          <h2>Best Features From Rebetas</h2>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={2}
            loop={true}
            speed={900}
            autoplay={{
              delay: 2800,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
            }}
            observer={true}
            observeParents={true}
            watchSlidesProgress={true}
            onSwiper={(swiper) => {
              setTimeout(() => {
                swiper.autoplay.start();
              }, 200);
            }}
            className="features-swiper"
          >
            <SwiperSlide>
              <div className="feature-card">
                <img src={videoTutorial} alt="Video Tutorial" />
                <div className="feature-card-content">
                  <p>
                    We have lots of easy to understand video tutorials to help
                    you learn the most effective virtual football betting
                    strategies.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={timeMoney} alt="Save Time and Money" />
                <div className="feature-card-content">
                  <p>
                    Rebetas software gives you the best predictions and saves
                    you time.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={autoUpdateIcon} alt="Auto Update" />
                <div className="feature-card-content">
                  <p>
                    Our system continuously updates prediction models using the
                    latest virtual football data.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={atmImage} alt="ATM Betting" />
                <div className="feature-card-content">
                  <p>
                    Turn your betting account into an ATM. Our predictions help
                    you make consistent profits.
                  </p>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="how-works">
        <div className="container">
          <span className="section-tag">HOW IT WORKS</span>

          <h2>How Rebetas Works</h2>

          <p className="how-sub">
            Our AI-powered system analyzes virtual football patterns and
            generates high-confidence predictions to help you make smarter
            betting decisions.
          </p>

          <div className="steps">
            <div className="step-card">
              <div className="step-number">01</div>

              <h3>Select Betting Platform</h3>

              <p>
                Choose your preferred virtual football betting platform
                supported by Rebetas.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>

              <h3>View AI Predictions</h3>

              <p>
                Our intelligent algorithm analyzes match patterns and generates
                high-probability predictions.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>

              <h3>Place Your Bets</h3>

              <p>
                Use the predictions to place smarter bets and increase your
                winning potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="platforms">
        <div className="container">
          <span className="section-tag">SUPPORTED PLATFORMS</span>

          <h2>Betting Platforms Supported by Rebetas</h2>

          <p className="platforms-sub">
            Rebetas works seamlessly with the most popular virtual football
            betting platforms.
          </p>

          <div className="platform-logos">
            {platforms.map((p) => (
              <img
                key={p._id}
                src={getImageUrl(p.logo)}
                alt={p.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}

      <section className="cta">
        <div className="container cta-inner">
          <h2>Start Winning With Rebetas Today</h2>

          <p>
            Create your free account and start accessing AI-powered virtual
            football predictions instantly.
          </p>

          <Link to="/register" className="cta-button">
            Create Free Account
          </Link>
        </div>
      </section>
      {/* FOOTER */}

      <Footer />
    </div>
  );
}
