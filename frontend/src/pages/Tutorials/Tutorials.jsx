import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Tutorials.css";
import { useNavigate } from "react-router-dom";

export default function Tutorials() {
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      title: "Welcome to Rebetas",
      text: "Rebetas gives you one clear edge — we select one match per round and predict OVER 1.5 goals. No confusion, just focus.",
    },
    {
      title: "Select Your Platform",
      text: "Choose your preferred virtual betting platform. Rebetas works across multiple platforms — you stay in control.",
    },
    {
      title: "Pick a League",
      text: "Each platform has different leagues. Select any league and follow the live prediction updates.",
    },
    {
      title: "Follow One Signal Only",
      text: "Every round, we pick ONE match. Don’t overthink it — follow the OVER 1.5 signal consistently.",
    },
    {
      title: "Use Smart Staking",
      text: "Discipline is key. Avoid overbetting. Follow a consistent staking approach for long-term results.",
    },
    {
      title: "Track Your Performance",
      text: "Monitor your wins, losses, and profit using the performance section. Stay data-driven.",
    },
    {
      title: "Stay Consistent",
      text: "Rebetas works best when you stay consistent. Avoid jumping between strategies or chasing losses.",
    },
  ];

  const step = steps[stepIndex];

  function handleTutorialClick(e) {
    e.preventDefault();
    alert("System busy. Tutorials are being prepared...");
  }

  return (
    <div className="tutorials-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      {/* HERO */}
      <section className="tutorials-hero">
        <div className="container">
          <span className="tutorial-tag">LEARNING CENTER</span>

          <h1>Learn How To Use Rebetas</h1>

          <p>
            Everything you need to understand how Rebetas works is right here.
            Follow these simple steps and start using the system the right way.
          </p>
        </div>
      </section>

      {/* GUIDE */}
      <section className="tutorial-options">
        <div className="container guide-container">
          <div className="guide-card">
            <h2>{step.title}</h2>

            <p>{step.text}</p>

            <div className="guide-actions">
              {stepIndex > 0 && (
                <button onClick={() => setStepIndex(stepIndex - 1)}>
                  Back
                </button>
              )}

              {stepIndex < steps.length - 1 ? (
                <button
                  className="primary"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    if (isLoggedIn) {
                      navigate("/dashboard");
                    } else {
                      navigate("/login");
                    }
                  }}
                >
                  Start Using Rebetas
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FALLBACK BUTTONS (DISABLED BUT PRESENT) */}
      <section className="tutorial-options">
        <div className="container options-grid">
          <div className="tutorial-card">
            <div className="tutorial-icon">💬</div>

            <h3>Telegram Community</h3>

            <p>Join our community (coming soon).</p>

            <button className="tutorial-btn" onClick={handleTutorialClick}>
              Join Telegram
            </button>
          </div>

          <div className="tutorial-card">
            <div className="tutorial-icon">▶</div>

            <h3>Video Tutorials</h3>

            <p>Watch step-by-step guides (coming soon).</p>

            <button className="tutorial-btn" onClick={handleTutorialClick}>
              Watch Tutorials
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
