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
          <span className="about-eyebrow">ABOUT SUNSTREAMERS</span>

          <h1>
            A Smarter Approach to
            <span> Virtual Football Signals.</span>
          </h1>

          <p>
            SunStreamers is a 24-hour smart and highly profit-oriented live
            virtual football prediction signal bot, designed to help users
            approach virtual football with greater structure, consistency and
            informed decision-making.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="about-story">
        <div className="container story-grid">
          <div className="story-content">
            <span className="about-eyebrow">WHO WE ARE</span>

            <h2>Built Around a Better Virtual Football Experience</h2>

            <p>
              Virtual football moves quickly. Matches are played continuously,
              and users often have limited time to assess their options before
              making a decision.
            </p>

            <p>
              SunStreamers was created to give virtual football users access to
              a more structured signal experience. Rather than approaching every
              match without direction, users can access prediction signals
              designed to support their betting decisions.
            </p>

            <p>
              Our focus is simple: make virtual football prediction signals
              accessible, convenient and useful throughout the day.
            </p>
          </div>

          <div className="story-highlight">
            <span className="highlight-label">THE SUNSTREAMERS APPROACH</span>

            <div className="highlight-number">24HRS</div>

            <h3>Virtual Football Signal Experience</h3>

            <p>
              A profit-oriented approach to accessing live virtual football
              prediction signals.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="about-mission">
        <div className="container">
          <div className="section-heading">
            <span className="about-eyebrow">OUR DIRECTION</span>
            <h2>What Drives SunStreamers</h2>
            <p>
              Our purpose and the experience we want to deliver to virtual
              football users.
            </p>
          </div>

          <div className="mission-grid">
            <div className="mission-card">
              <span className="mission-number">01</span>
              <h3>Our Mission</h3>
              <p>
                To make virtual football prediction signals more accessible
                through a convenient, structured and profit-oriented signal
                experience that supports more informed betting decisions.
              </p>
            </div>

            <div className="mission-card">
              <span className="mission-number">02</span>
              <h3>Our Vision</h3>
              <p>
                To become a recognised destination for virtual football signal
                solutions, helping users across supported betting platforms
                approach the game with greater structure and confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section className="about-tech">
        <div className="container tech-grid">
          <div className="tech-box">
            <div className="tech-orbit">
              <div className="tech-core">SS</div>
            </div>

            <span className="tech-caption">SUNSTREAMERS</span>
            <h3>Signals. Structure. Decisions.</h3>
          </div>

          <div className="tech-content">
            <span className="about-eyebrow">THE PRODUCT</span>

            <h2>Your Virtual Football Signals, All in One Place.</h2>

            <p>
              SunStreamers is designed around one central purpose: providing
              users with access to live virtual football prediction signals
              through a dedicated platform.
            </p>

            <p>
              The experience brings signal access and supported betting
              platforms together in a streamlined environment, making it easier
              for users to follow available signals and decide how they want to
              approach their betting.
            </p>

            <p>
              SunStreamers provides signals to support decision-making. It does
              not eliminate the uncertainty associated with betting or guarantee
              winning outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* WHY SUNSTREAMERS */}
      <section className="about-why">
        <div className="container">
          <div className="section-heading">
            <span className="about-eyebrow">WHY SUNSTREAMERS</span>

            <h2>Designed Around What Matters</h2>

            <p>
              A focused virtual football signal experience built around
              accessibility, convenience and informed decisions.
            </p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <span className="why-number">01</span>
              <h3>24-Hour Signal Experience</h3>
              <p>
                Built around the continuous nature of virtual football, giving
                users a dedicated place to access available prediction signals
                throughout the day.
              </p>
            </div>

            <div className="why-card">
              <span className="why-number">02</span>
              <h3>Profit-Oriented Approach</h3>
              <p>
                Focused on helping users approach virtual football with signals
                intended to support more deliberate betting decisions.
              </p>
            </div>

            <div className="why-card">
              <span className="why-number">03</span>
              <h3>Multiple Platform Support</h3>
              <p>
                Designed to serve users across supported virtual football
                betting platforms.
              </p>
            </div>

            <div className="why-card">
              <span className="why-number">04</span>
              <h3>A Streamlined Experience</h3>
              <p>
                A dedicated environment for accessing prediction signals without
                unnecessary complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RESPONSIBLE USE */}
      <section className="about-responsibility">
        <div className="container responsibility-content">
          <span className="about-eyebrow">A RESPONSIBLE APPROACH</span>

          <h2>Signals Are Guidance, Not Guarantees.</h2>

          <p>
            Virtual football betting involves uncertainty, and no prediction
            signal can guarantee a winning outcome or consistent profit.
            SunStreamers is designed to support users' decisions, not replace
            personal judgement.
          </p>

          <p>
            Always bet responsibly, understand the risks involved and never
            stake money you cannot afford to lose.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
