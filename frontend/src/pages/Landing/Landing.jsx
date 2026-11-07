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
            <span className="hero-label">INTRODUCING SUNSTREAMERS</span>

            <h1>
              24HRS SMART AND HIGHLY PROFIT ORIENTED LIVE VIRTUAL FOOTBALL
              PREDICTION SIGNAL BOT
            </h1>

            <p>
              Take a more strategic approach to virtual football betting.
              SunStreamers delivers live virtual football prediction signals
              around the clock, helping you identify betting opportunities and
              make more informed decisions across supported platforms.
            </p>

            <Link to="/register" className="hero-primary">
              Get Started Now
            </Link>
          </div>

          <div className="hero-platforms-area">
            <p className="platform-title">
              Available Across Supported Virtual Football Platforms
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
              <span className="section-tag">THE SUNSTREAMERS ADVANTAGE</span>

              <h2>Your 24-Hour Virtual Football Prediction Signal Companion</h2>
            </div>

            <div className="about-right">
              <p>
                SunStreamers is built for virtual football bettors who want
                access to live prediction signals throughout the day. Our
                profit-oriented signal platform is designed to help users
                identify potential opportunities, follow supported virtual
                football competitions, and approach their betting decisions with
                greater structure. Whether you are following virtual football
                during the day or at night, SunStreamers brings its signal
                experience together in one platform.
              </p>
            </div>
          </div>

          {/* PREMIUM INDICATOR */}

          <div className="indicator-grid">
            <div className="indicator-card">
              <h3>SunStreamers Premium Indicator</h3>

              <p>
                Get access to the SunStreamers Premium virtual football
                prediction signal experience. Receive live prediction signals
                designed to help you identify potential betting opportunities
                across supported virtual football platforms, with an
                around-the-clock approach to signal access.
              </p>

              <Link to="/pricing" className="indicator-btn">
                View Premium Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SUNSTREAMERS */}

      <section className="why-section">
        <div className="why-container">
          <div className="why-content">
            <span className="section-tag">WHY SUNSTREAMERS?</span>

            <h2>
              Stop Relying on Guesswork. Follow a More Structured Signal
              Approach.
            </h2>

            <p>
              Virtual football moves quickly, with matches taking place
              throughout the day. Finding and assessing opportunities manually
              can be time-consuming. SunStreamers is designed to make live
              prediction signals available around the clock, giving you a
              dedicated platform to follow virtual football signals and assess
              potential betting opportunities.
            </p>

            <Link to="/about" className="why-btn">
              Learn More About Us
            </Link>
          </div>

          <div className="why-image">
            <img
              src={predictionScreen}
              alt="SunStreamers live virtual football prediction dashboard"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section className="features-section">
        <div className="container">
          <span className="section-tag">BUILT FOR VIRTUAL FOOTBALL</span>

          <h2>Everything You Need for a More Organised Signal Experience</h2>

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
                <img src={videoTutorial} alt="SunStreamers video tutorials" />

                <div className="feature-card-content">
                  <p>
                    <strong>Easy-to-Follow Tutorials</strong>
                    <br />
                    Get familiar with the platform through practical video
                    tutorials designed to help you understand its features and
                    how to use the available signals.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={timeMoney} alt="Around-the-clock signal access" />

                <div className="feature-card-content">
                  <p>
                    <strong>24-Hour Signal Experience</strong>
                    <br />
                    Stay connected to the virtual football signal experience
                    throughout the day, with a platform designed around the
                    continuous nature of virtual football.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={autoUpdateIcon} alt="SunStreamers signal updates" />

                <div className="feature-card-content">
                  <p>
                    <strong>Live Signal Updates</strong>
                    <br />
                    Follow available prediction signals and updates as they
                    become available through the SunStreamers platform.
                  </p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="feature-card">
                <img src={atmImage} alt="Profit-oriented betting approach" />

                <div className="feature-card-content">
                  <p>
                    <strong>Profit-Oriented Approach</strong>
                    <br />
                    SunStreamers is designed to help you identify potential
                    betting opportunities and approach virtual football betting
                    with a more deliberate strategy. Results are never
                    guaranteed, and betting involves risk.
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
          <span className="section-tag">GET STARTED IN THREE STEPS</span>

          <h2>How SunStreamers Works</h2>

          <p className="how-sub">
            Getting started is straightforward. Choose your preferred supported
            platform, access the available signals, and decide how you want to
            use the information.
          </p>

          <div className="steps">
            <div className="step-card">
              <div className="step-number">01</div>

              <h3>Choose Your Platform</h3>

              <p>
                Select your preferred virtual football betting platform from the
                supported platforms available on SunStreamers.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>

              <h3>Access Live Signals</h3>

              <p>
                Explore the available virtual football prediction signals for
                your selected platform and competition.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>

              <h3>Make Your Betting Decision</h3>

              <p>
                Assess the available signals, consider your risk, and make your
                own informed betting decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED PLATFORMS */}

      <section className="platforms">
        <div className="container">
          <span className="section-tag">OUR PLATFORM NETWORK</span>

          <h2>One Signal Platform. Multiple Betting Platforms.</h2>

          <p className="platforms-sub">
            SunStreamers is designed to serve virtual football bettors across
            multiple supported betting platforms. Select your preferred platform
            and explore the available competitions.
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
          <h2>Ready to Experience 24-Hour Virtual Football Signals?</h2>

          <p>
            Get started with SunStreamers and explore a profit-oriented virtual
            football prediction signal platform designed to keep you connected
            to live signals throughout the day.
          </p>

          <Link to="/register" className="cta-button">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* FOOTER */}

      <Footer />
    </div>
  );
}
