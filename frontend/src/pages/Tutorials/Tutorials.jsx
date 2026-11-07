import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Tutorials.css";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../../services/tracking";

const tutorialCategories = [
  {
    id: "registration",
    number: "01",
    title: "Registration Tutorials",
    description:
      "Learn how to create your SunStreamers account and get started with the platform.",
    videoSrc: "/videos/registration-tutorial.mp4",
    topics: [
      "Creating your SunStreamers account",
      "Completing the registration process",
      "Getting started after registration",
    ],
  },
  {
    id: "login",
    number: "02",
    title: "Login Tutorials",
    description:
      "Learn how to securely access your account and manage your login details.",
    videoSrc: "/videos/login-tutorial.mp4",
    topics: [
      "How to log in to your account",
      "Accessing your account dashboard",
      "Password recovery and reset",
    ],
  },
  {
    id: "dashboard",
    number: "03",
    title: "Dashboard Tutorials",
    description:
      "Understand your dashboard and learn to navigate the different sections of SunStreamers.",
    videoSrc: "/videos/dashboard-tutorial.mp4",
    topics: [
      "Understanding your dashboard",
      "Navigating available features",
      "Understanding your subscription and account",
    ],
  },
  {
    id: "signals",
    number: "04",
    title: "Signal Access & Usage",
    description:
      "Learn how to find, understand and follow available virtual football prediction signals.",
    videoSrc: "/videos/signal-tutorial.mp4",
    topics: [
      "How to access live prediction signals",
      "Understanding match and prediction information",
      "Following signals on supported platforms",
    ],
  },
];

const steps = [
  {
    title: "Welcome to SunStreamers",
    text: "SunStreamers gives you access to virtual football prediction signals designed around a focused, profit-oriented approach. Learn how to navigate the platform and follow available signals.",
  },
  {
    title: "Select Your Platform",
    text: "Choose your preferred supported virtual betting platform. SunStreamers is designed to help you access prediction signals for supported platforms while you remain in control of your betting decisions.",
  },
  {
    title: "Pick a League",
    text: "Different platforms may have different virtual football leagues. Select your preferred league and explore the available prediction updates.",
  },
  {
    title: "Understand the Signal",
    text: "SunStreamers provides a focused prediction signal for each selected round. Pay attention to the match information and the OVER and UNDER 2.5 goals prediction.",
  },
  {
    title: "Make Informed Decisions",
    text: "Use the available prediction information to guide your decisions. Signals are not guarantees of winning outcomes, so always consider the risks before placing a bet.",
  },
  {
    title: "Track Your Performance",
    text: "Where available, use the platform's performance information to review your results and understand your betting activity.",
  },
  {
    title: "Stay Disciplined",
    text: "Avoid chasing losses or staking money you cannot afford to lose. A prediction signal is guidance, not a guarantee. Responsible betting and personal judgement remain important.",
  },
];

export default function Tutorials() {
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const trackedStep = useRef(-1);

  const step = steps[stepIndex];

  useEffect(() => {
    trackEvent("ViewContent", {
      content_name: "SunStreamers Tutorials",
      content_category: "Learning Center",
    });
  }, []);

  useEffect(() => {
    if (trackedStep.current === stepIndex) return;

    trackedStep.current = stepIndex;

    trackEvent("TutorialStepView", {
      content_name: step.title,
      content_category: "Tutorials",
      tutorial_step: stepIndex + 1,
    });
  }, [stepIndex, step.title]);

  return (
    <div className="tutorials-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <section className="tutorials-hero">
        <div className="container">
          <span className="tutorial-tag">SUNSTREAMERS LEARNING CENTRE</span>

          <h1>
            Learn SunStreamers.
            <span> Understand Every Signal.</span>
          </h1>

          <p>
            Everything you need to know about using SunStreamers, from creating
            your account to accessing your dashboard and following live virtual
            football prediction signals. Learn at your own pace with our
            step-by-step video guides.
          </p>

          <div className="tutorial-hero-stats">
            <div className="tutorial-stat">
              <strong>04</strong>
              <span>Tutorial Categories</span>
            </div>

            <div className="tutorial-stat-divider"></div>

            <div className="tutorial-stat">
              <strong>24HRS</strong>
              <span>Signal Experience</span>
            </div>

            <div className="tutorial-stat-divider"></div>

            <div className="tutorial-stat">
              <strong>100%</strong>
              <span>Learn at Your Pace</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tutorial-video-section">
        <div className="container">
          <div className="tutorial-section-heading">
            <div>
              <span className="tutorial-section-tag">
                VIDEO LEARNING CENTRE
              </span>

              <h2>Explore Our Tutorials</h2>

              <p>
                Watch our guided lessons to understand how to use every
                important part of the SunStreamers platform.
              </p>
            </div>
          </div>

          <div className="tutorial-video-grid">
            {tutorialCategories.map((category) => (
              <article className="tutorial-video-card" key={category.id}>
                <div className="tutorial-video-player-wrap">
                  <div className="tutorial-video-player-frame">
                    <video
                      className="tutorial-video-player"
                      src={category.videoSrc}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={`${category.title} video tutorial`}
                    >
                      Your browser does not support HTML video.
                    </video>
                  </div>
                </div>

                <div className="tutorial-video-content">
                  <span className="tutorial-video-label">
                    TUTORIAL {category.number}
                  </span>

                  <h3>{category.title}</h3>

                  <p>{category.description}</p>

                  <div className="tutorial-topic-list">
                    {category.topics.map((topic, index) => (
                      <div className="tutorial-topic" key={index}>
                        <span className="topic-check">✓</span>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tutorial-video-footer">
                    <span>
                      <span className="video-status-dot"></span>
                      Video Tutorial
                    </span>

                    <span>9:16 VERTICAL</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tutorial-guide-section">
        <div className="container">
          <div className="tutorial-section-heading">
            <span className="tutorial-section-tag">QUICK START GUIDE</span>

            <h2>Understand How SunStreamers Works</h2>

            <p>
              Follow this interactive introduction to understand the basic steps
              involved in accessing and using virtual football prediction
              signals.
            </p>
          </div>

          <div className="guide-wrapper">
            <div className="guide-progress">
              <div className="guide-progress-info">
                <span>YOUR LEARNING PROGRESS</span>

                <strong>
                  STEP {stepIndex + 1} OF {steps.length}
                </strong>
              </div>

              <div className="guide-progress-track">
                <div
                  className="guide-progress-fill"
                  style={{
                    width: `${((stepIndex + 1) / steps.length) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="guide-step-indicators">
                {steps.map((item, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`guide-step-dot ${
                      index === stepIndex ? "active" : ""
                    } ${index < stepIndex ? "completed" : ""}`}
                    onClick={() => setStepIndex(index)}
                    aria-label={`Go to step ${index + 1}: ${item.title}`}
                    title={item.title}
                  >
                    {index < stepIndex ? "✓" : index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-step-label">
                STEP {String(stepIndex + 1).padStart(2, "0")}
              </div>

              <div className="guide-card-icon">✦</div>

              <h3>{step.title}</h3>

              <p>{step.text}</p>

              <div className="guide-actions">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    className="guide-back-btn"
                    onClick={() => setStepIndex(stepIndex - 1)}
                  >
                    ← Back
                  </button>
                )}

                {stepIndex < steps.length - 1 ? (
                  <button
                    type="button"
                    className="guide-next-btn"
                    onClick={() => setStepIndex(stepIndex + 1)}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="guide-next-btn"
                    onClick={() => {
                      if (isLoggedIn) {
                        navigate("/dashboard");
                      } else {
                        navigate("/login");
                      }
                    }}
                  >
                    Start Using SunStreamers →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tutorial-support-section">
        <div className="container">
          <div className="tutorial-support-card">
            <div className="support-content">
              <span className="tutorial-section-tag">NEED HELP?</span>

              <h2>Your SunStreamers Journey Starts Here.</h2>

              <p>
                Whether you are creating an account, exploring your dashboard or
                learning how to follow signals, our learning centre is designed
                to guide you through the experience.
              </p>
            </div>

            <div className="support-action">
              <button
                type="button"
                className="tutorial-support-btn"
                onClick={() => {
                  if (isLoggedIn) {
                    navigate("/dashboard");
                  } else {
                    navigate("/register");
                  }
                }}
              >
                {isLoggedIn ? "Go to Dashboard" : "Create Your Account"}
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
