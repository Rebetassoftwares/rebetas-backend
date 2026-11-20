import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Tutorials.css";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../../services/tracking";
import tutorialVideo from "../../assets/videos/tutorial-video.mp4";

const guides = [
  {
    id: "registration",
    number: "01",
    title: "How to Create an Account",
    description: "Get started by registering your SunStreamers account.",
    steps: [
      "Open the SunStreamers registration page.",
      "Enter the information requested in the registration form.",
      "Review your details and submit the form.",
    ],
  },
  {
    id: "verification",
    number: "02",
    title: "How to Verify Your Account",
    description: "Complete the account verification process where required.",
    steps: [
      "Go to your email, open the email sent to you and click on the verification button sent to you.",
      "After verification succeeds, go back to the SunStreamers website and log in.",
    ],
  },
  {
    id: "login",
    number: "03",
    title: "How to Log In",
    description: "Learn how to access your SunStreamers account.",
    steps: [
      "Open the SunStreamers login page.",
      "Enter your registered email address and password.",
      "Submit the login form.",
      "Check your email and enter the login OTP sent to you on the pop-up screen.",
      "Once successful, congratulations! You are finally logged in.",
      "If you forget your password, use the password recovery option.",
    ],
  },
  {
    id: "dashboard",
    number: "04",
    title: "Understanding Your Dashboard",
    description: "Get familiar with the different areas of your account.",
    steps: [
      "Log in to open your dashboard.",
      "Review the sections and account information displayed.",
      "Use the navigation links to access available platform features.",
      "Check your account and subscription information when needed.",
    ],
  },
  {
    id: "signals",
    number: "05",
    title: "How to Access and Follow Signals",
    description: "Learn how to find available virtual football predictions.",
    steps: [
      "Once logged in, click on your preferred betting platform from the list of betting platforms on the Dashboard.",
      "Choose a supported betting platform. You will be directed to the platform-specific prediction signal screen where you will start seeing the predictions.",
      "Once you are on the prediction page, select the league of the platform you want to bet on, and that's it! You start getting the prediction signals.",
      "Once the predictions start, head to your betting platform and select the exact same virtual football league you selected on your SunStreamers prediction screen.",
      "Once you are there, you can start using the predictions from SunStreamers. Remember, you must be betting on one single game provided by the SunStreamers Bot. Make sure it's on the week, season, or match day. Make sure to bet on the team recommended by the Bot, as well as the market/outcome that the Bot predicts.",
    ],
  },
  {
    id: "subscription",
    number: "06",
    title: "How to Subscribe",
    description: "Understand the subscription and payment process.",
    steps: [
      "Click on the Activate button or visit the Pricing Page.",
      "On the Subscription section, click the SELECT COUNTRY button and select your country.",
      "Review the subscription amount for your country and click PROCEED.",
      "Select your preferred payment option and follow the payment instructions.",
      "Check your account for subscription status or confirmation after payment.",
    ],
  },
  {
    id: "refund",
    number: "07",
    title: "How to Request Your 24-Hour Refund",
    description: "Learn how to claim your full money-back guarantee.",
    steps: [
      "If you are not satisfied with SunStreamers, you can request a full refund within 24 hours of purchasing your subscription.",
      "Send an email to support@sunstreamers.com within 24 hours of purchase, stating that you want to request a refund.",
      "Include your registered email address and payment reference or subscription invoice so our support team can identify your transaction.",
      "You will receive a full refund of the subscription amount you paid. No deductions and no conditions.",
    ],
  },
];

export default function Tutorials() {
  const isLoggedIn = !!localStorage.getItem("rebetas_token");
  const navigate = useNavigate();
  const [expandedGuide, setExpandedGuide] = useState(null);

  useEffect(() => {
    trackEvent("ViewContent", {
      content_name: "SunStreamers Tutorials",
      content_category: "Learning Center",
    });
  }, []);

  const toggleGuide = (guide) => {
    const next = expandedGuide === guide.id ? null : guide.id;
    setExpandedGuide(next);

    if (next) {
      trackEvent("TutorialGuideView", {
        content_name: guide.title,
        content_category: "How-To Guides",
      });
    }
  };

  const handlePrimaryAction = () => {
    navigate(isLoggedIn ? "/dashboard" : "/register");
  };

  return (
    <div className="tutorials-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <main>
        <section className="tutorials-hero">
          <div className="container">
            <span className="tutorial-tag">SUNSTREAMERS TUTORIAL</span>

            <h1>Learn How SunStreamers Works</h1>

            <p>
              Watch this short tutorial to understand the platform and how to
              get started.
            </p>
          </div>
        </section>

        <section className="main-tutorial-section">
          <div className="container">
            <div className="main-tutorial-card">
              <div className="main-tutorial-video">
                <video
                  src={tutorialVideo}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="SunStreamers tutorial video"
                >
                  Your browser does not support HTML video.
                </video>
              </div>

              <div className="main-tutorial-meta">
                <div>
                  <span className="tutorial-section-tag">START HERE</span>

                  <h2>SunStreamers: Complete Walkthrough</h2>

                  <p>Everything you need to know to get started.</p>
                </div>

                <span className="tutorial-duration">6:25</span>
              </div>
            </div>

            <div className="tutorial-primary-action">
              <button type="button" onClick={handlePrimaryAction}>
                {isLoggedIn ? "Go to Your Dashboard" : "Create Your Account"}

                <span>→</span>
              </button>

              {!isLoggedIn && (
                <span>
                  Ready to get started? Create your SunStreamers account.
                </span>
              )}
            </div>

            <div className="tutorial-guarantee">
              <div className="tutorial-guarantee-icon">
                <span>✓</span>
              </div>

              <div className="tutorial-guarantee-content">
                <span className="tutorial-guarantee-tag">
                  SUBSCRIBE WITH CONFIDENCE
                </span>

                <h2>24-Hour Money-Back Guarantee</h2>

                <p>
                  Not completely satisfied with SunStreamers? No problem! Your
                  subscription is protected by our 24-Hour Money-Back Guarantee.
                </p>

                <p>
                  If you are not satisfied with your experience, request a
                  <strong>
                    {" "}
                    100% refund of your subscription payment within 24 hours of
                    purchase.
                  </strong>
                </p>

                <strong className="tutorial-guarantee-promise">
                  100% Refund. No Deductions. No Conditions.
                </strong>

                <span className="tutorial-guarantee-contact">
                  To request your refund, contact support@sunstreamers.com
                  within 24 hours of purchase.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="how-to-section">
          <div className="container">
            <div className="how-to-heading">
              <span className="tutorial-section-tag">STEP-BY-STEP HELP</span>

              <h2>How-To Guides</h2>

              <p>
                Need help with a particular task? Select a guide below to see
                the steps.
              </p>
            </div>

            <div className="how-to-list">
              {guides.map((guide) => {
                const isExpanded = expandedGuide === guide.id;

                return (
                  <article
                    className={`how-to-item ${isExpanded ? "expanded" : ""}`}
                    key={guide.id}
                  >
                    <button
                      type="button"
                      className="how-to-trigger"
                      onClick={() => toggleGuide(guide)}
                      aria-expanded={isExpanded}
                      aria-controls={`guide-panel-${guide.id}`}
                    >
                      <span className="how-to-number">{guide.number}</span>

                      <span className="how-to-title-wrap">
                        <strong>{guide.title}</strong>
                        <small>{guide.description}</small>
                      </span>

                      <span className="how-to-chevron">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        className="how-to-panel"
                        id={`guide-panel-${guide.id}`}
                      >
                        <ol>
                          {guide.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
