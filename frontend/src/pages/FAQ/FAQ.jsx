import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import "./FAQ.css";

export default function FAQ() {
  const [active, setActive] = useState(null);

  const toggle = (index) => {
    setActive(active === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Rebetas?",
      answer:
        "Rebetas is an AI-powered virtual football prediction platform built to analyze virtual match patterns, identify opportunities, and provide structured prediction insights for supported betting platforms.",
    },
    {
      question: "How does Rebetas work?",
      answer:
        "Rebetas studies virtual football patterns, prediction timing, and match behavior using intelligent models. The platform then presents users with organized prediction signals that are easier to follow and act on.",
    },
    {
      question: "Which betting platforms are supported?",
      answer:
        "Rebetas supports major betting platforms that provide virtual football markets, including Bet9ja, SportyBet, BetKing, Betway, 1xBet, and BangBet.",
    },
    {
      question: "Do I need betting experience before using Rebetas?",
      answer:
        "No. Rebetas is designed to be beginner friendly while still offering enough depth for experienced users. New users can start with the free option and gradually understand how the system works.",
    },
    {
      question: "Is there a free plan available?",
      answer:
        "Yes. Rebetas includes a free option that allows users to get started and understand the platform before moving to premium or ultra plans.",
    },
    {
      question:
        "What is the difference between Free, Premium, and Ultra plans?",
      answer:
        "The Free plan offers limited access. The Premium plan gives earlier and stronger access to prediction tools. The Ultra plan includes the most advanced access, including additional support for users who want deeper functionality and stronger workflow benefits.",
    },
    {
      question: "Can I use Rebetas on mobile devices?",
      answer:
        "Yes. Rebetas is designed to work across desktop, tablet, and mobile devices so users can access predictions wherever they are.",
    },
    {
      question: "Does Rebetas guarantee winning every bet?",
      answer:
        "No. Rebetas is a prediction and decision-support platform, not a guarantee system. It helps improve structure and confidence in betting decisions, but users should always bet responsibly.",
    },
    {
      question: "How often are predictions updated?",
      answer:
        "Predictions and supported plan data are updated based on the platform’s active logic, timing requirements, and virtual football behavior patterns.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Yes. Users can start with one plan and move to another plan later depending on their needs, budget, and preferred level of access.",
    },
    {
      question: "How is pricing determined?",
      answer:
        "Pricing can vary by country and billing cycle. Weekly and monthly amounts are displayed based on the selected country plan inside the pricing section.",
    },
    {
      question: "Is Rebetas suitable for serious bettors?",
      answer:
        "Yes. While Rebetas is simple enough for beginners, it is also structured for users who want a more organized and professional virtual football prediction workflow.",
    },
  ];

  return (
    <div className="faq-page">
      <Navbar />

      {/* HERO */}

      <section className="faq-hero">
        <div className="container">
          <span className="faq-tag">HELP CENTER</span>

          <h1>Frequently Asked Questions</h1>

          <p>
            Everything you need to know about Rebetas, pricing, supported
            platforms, plans, and how the system works.
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}

      <section className="faq-section">
        <div className="container">
          <div className="faq-header">
            <h2>Questions & Answers</h2>
            <p>
              Explore the most common questions users ask before getting started
              with Rebetas.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${active === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggle(index)}
                  type="button"
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {active === index ? "−" : "+"}
                  </span>
                </button>

                <div
                  className={`faq-answer-wrap ${active === index ? "open" : ""}`}
                >
                  <div className="faq-answer">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
