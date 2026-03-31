import Navbar from "../../components/Navbar/Navbar";
import { Link } from "react-router-dom";
import "./Landing.css";
import { useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import Footer from "../../components/Footer/Footer";

import "swiper/css";
import "swiper/css/pagination";

import heroBg from "../../assets/hero_sport.jpg";
import { getImageUrl } from "../../utils/getImageUrl";

import predictionScreen from "../../assets/prediction-screen.png";

import autoUpdateIcon from "../../assets/autoupdate.png";
import atmImage from "../../assets/atm-betting.jpg";
import videoTutorial from "../../assets/video-tutorial.jpg";
import timeMoney from "../../assets/time-money.jpg";

import usePlatforms from "../../hooks/usePlatforms";
import useLeagues from "../../hooks/useLeagues";
import useHistory from "../../hooks/useHistory";
import HistorySection from "../../components/history/HistorySection";

export default function Landing() {
  const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString()}`;
  };
  const { platforms, platformId, setPlatformId } = usePlatforms();

  const { leagueOptions, league, setLeague } = useLeagues(platformId);

  const selectedLeague = leagueOptions.find((item) => item._id === league);

  const platformKey = selectedLeague?.platformId?.name?.toLowerCase();

  const leagueKey = selectedLeague?.leagueName;

  const platformName = selectedLeague?.platformId?.name || "";

  const [timeframe, setTimeframe] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { filteredPredictions, summary, loadingHistory } = useHistory({
    platformKey,
    leagueKey,
    timeframe,
    customStartDate,
    customEndDate,
  });

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

      <HistorySection
        platformName={platformName}
        leagueKey={leagueKey}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        summary={summary}
        formatCurrency={formatCurrency}
        filteredPredictions={filteredPredictions}
        loadingHistory={loadingHistory}
      />

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
