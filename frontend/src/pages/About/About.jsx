import Navbar from "../../components/Navbar/Navbar";
import "./About.css";
import Footer from "../../components/Footer/Footer";

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      {/* HERO */}

      <section className="about-hero">
        <div className="container">
          <h1>About Rebetas</h1>

          <p>
            Rebetas is an advanced virtual football prediction platform built to
            help bettors make smarter decisions through data driven insights,
            probability models and intelligent pattern analysis.
          </p>
        </div>
      </section>

      {/* STORY */}

      <section className="about-story">
        <div className="container story-grid">
          <div>
            <h2>Our Story</h2>

            <p>
              Virtual football betting generates massive streams of data. Most
              bettors rely on guesswork, emotions or random selections.
            </p>

            <p>
              Rebetas was created to change that approach. By analyzing patterns
              within historical virtual match data, our system identifies
              probabilities and potential outcomes that help users make more
              informed betting decisions.
            </p>
          </div>

          <div className="story-highlight">Data Driven Predictions</div>
        </div>
      </section>

      {/* MISSION */}

      <section className="about-mission">
        <div className="container mission-grid">
          <div className="mission-card">
            <h3>Our Mission</h3>
            <p>
              To empower bettors with intelligent tools that transform betting
              decisions from guesswork into calculated strategies.
            </p>
          </div>

          <div className="mission-card">
            <h3>Our Vision</h3>
            <p>
              To become the leading prediction intelligence platform for virtual
              sports across global betting ecosystems.
            </p>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}

      <section className="about-tech">
        <div className="container tech-grid">
          <div className="tech-box">Prediction Engine</div>

          <div>
            <h2>Our Technology</h2>

            <p>
              Rebetas analyzes historical virtual football data, detects
              repeating behavioral patterns and applies probability models to
              generate prediction insights.
            </p>

            <p>
              The platform processes match statistics, odds patterns and
              simulation cycles to identify potential opportunities within
              virtual sports systems.
            </p>
          </div>
        </div>
      </section>

      {/* WHY REBETAS */}

      <section className="about-why">
        <div className="container">
          <h2>Why Rebetas</h2>

          <div className="why-grid">
            <div className="why-card">
              <h3>Advanced Algorithms</h3>
              <p>
                Intelligent models analyze large volumes of virtual match data
                to identify patterns.
              </p>
            </div>

            <div className="why-card">
              <h3>Cross Platform Support</h3>
              <p>
                Compatible with major virtual football betting platforms used
                globally.
              </p>
            </div>

            <div className="why-card">
              <h3>Clean Dashboard</h3>
              <p>
                A streamlined interface designed for fast and efficient access
                to prediction insights.
              </p>
            </div>

            <div className="why-card">
              <h3>Continuous Improvement</h3>
              <p>
                Our prediction systems evolve continuously as more data is
                analyzed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
