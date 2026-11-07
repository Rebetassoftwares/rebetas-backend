import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import "./FAQ.css";

export default function FAQ() {
  const [active, setActive] = useState(null);

  const toggle = (index) => {
    setActive((current) => (current === index ? null : index));
  };

  const faqs = [
    {
      question: "What is SunStreamers?",
      answer:
        "SunStreamers is a 24-hour smart virtual football prediction signal bot designed to provide users with organized prediction signals across supported virtual football platforms. It helps users make more informed decisions when following virtual football markets.",
    },
    {
      question: "How does SunStreamers work?",
      answer:
        "After registering and accessing your account, you can use your dashboard to access the available prediction signals. Follow the instructions provided in the signal and use the relevant supported betting platform to make your own decisions.",
    },
    {
      question: "Which betting platforms are supported?",
      answer:
        "SunStreamers supports virtual football users on Bet9ja, SportyBet, BetKing, Betway, 1xBet, and BangBet.",
    },
    {
      question: "Do I need previous betting experience?",
      answer:
        "No. SunStreamers is designed to be straightforward to access and use. Our tutorials cover registration, login, dashboard navigation, and how to access and use the prediction signals.",
    },
    {
      question: "How do I create a SunStreamers account?",
      answer:
        "Visit the registration page, provide the required account information, and complete the registration process. Once your account is created, you can log in to access your account.",
    },
    {
      question: "How do I access the prediction signals?",
      answer:
        "Log in to your SunStreamers account and navigate to your dashboard. The dashboard is where you access the available signal information. You can also follow the tutorials on our Tutorials page for guidance.",
    },
    {
      question: "Is SunStreamers available 24 hours?",
      answer:
        "SunStreamers is positioned as a 24-hour virtual football prediction signal service. Actual signal availability is subject to the service's active signal schedule.",
    },
    {
      question: "What is the reported winning rate?",
      answer:
        "SunStreamers has a reported winning rate of 85% across 100 tracked predictions. This is a historical performance figure, not a promise of future results. Individual predictions can be wrong, and actual outcomes will vary.",
    },
    {
      question: "Does SunStreamers guarantee winning every prediction?",
      answer:
        "No. No prediction service can guarantee that every prediction will win. SunStreamers provides prediction signals to support your decision-making, but virtual football outcomes remain uncertain. Never treat a prediction as guaranteed profit.",
    },
    {
      question: "Is there a subscription plan?",
      answer:
        "Yes. SunStreamers offers a monthly Premium subscription. Visit the Pricing page to view the current price applicable to your selected country and proceed with the available subscription option.",
    },
    {
      question: "Can I use SunStreamers on my mobile phone?",
      answer:
        "Yes. SunStreamers is designed to work on mobile phones, tablets, and desktop devices, allowing you to access your account across different screen sizes.",
    },
    {
      question: "How do I get help if I have a problem?",
      answer:
        "For assistance with your account or the service, contact our support team at support@sunstreamers.com.",
    },
    {
      question: "Should I stake money I cannot afford to lose?",
      answer:
        "No. Virtual football predictions involve risk, and losses are possible. Only use money you can afford to lose, avoid chasing losses, and make your own responsible betting decisions.",
    },
  ];

  return (
    <div className="faq-page">
      <Navbar />

      <section className="faq-hero">
        <div className="container">
          <span className="faq-tag">SUNSTREAMERS HELP CENTER</span>

          <h1>Frequently Asked Questions</h1>

          <p>
            Find answers about SunStreamers, account registration, prediction
            signals, supported platforms, subscriptions, and how to get started.
          </p>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <div className="faq-header">
            <h2>How Can We Help You?</h2>
            <p>
              Get familiar with the service and find the information you need to
              use SunStreamers.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isActive = active === index;
              const answerId = `faq-answer-${index}`;

              return (
                <div
                  key={index}
                  className={`faq-item ${isActive ? "active" : ""}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggle(index)}
                    type="button"
                    aria-expanded={isActive}
                    aria-controls={answerId}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon" aria-hidden="true">
                      {isActive ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    id={answerId}
                    className={`faq-answer-wrap ${isActive ? "open" : ""}`}
                    aria-hidden={!isActive}
                  >
                    <div className="faq-answer">{faq.answer}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="faq-contact">
            <h2>Still Have Questions?</h2>
            <p>
              Our support team is available to assist you with questions about
              SunStreamers and your account.
            </p>
            <a href="mailto:support@sunstreamers.com">Contact Support</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
