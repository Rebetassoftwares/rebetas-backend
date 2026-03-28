import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Legal.css";

export default function Privacy() {
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;

  return (
    <div className="legal-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <section className="legal-hero">
        <div className="container legal-hero-content">
          <span className="legal-tag">LEGAL</span>
          <h1>Privacy Policy</h1>
          <p className="legal-date">
            Effective Date: [21/05/2025]
            <br />
            Last Updated: [01/01/2026]
          </p>
        </div>
      </section>

      <section className="legal-section">
        <div className="container legal-content">
          <p>
            This Privacy Policy describes how Rebetas ("we", "us", or "our")
            collects, uses, stores, and protects your personal information when
            you access or use our platform. By using Rebetas, you consent to the
            practices described in this Privacy Policy.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            We may collect personal and non-personal information including your
            name, email address, account credentials, subscription details,
            transaction records, device information, IP address, and usage
            behavior on the platform.
          </p>

          <h3>2. Information You Provide</h3>
          <p>
            When you register, subscribe, or interact with the platform, you
            provide information such as your email, username, and any other data
            required to deliver our services.
          </p>

          <h3>3. Automatically Collected Data</h3>
          <p>
            We may automatically collect technical information including your
            browser type, device type, IP address, location (approximate), and
            interaction data such as pages visited and time spent on the
            platform.
          </p>

          <h3>4. How We Use Your Information</h3>
          <p>
            Your information is used to provide and maintain our services,
            manage accounts, process subscriptions and payments, improve user
            experience, communicate with you, detect fraud, and ensure platform
            security.
          </p>

          <h3>5. Payment Information</h3>
          <p>
            Payments on Rebetas are processed by third-party providers. We do
            not store your card or banking details. Payment providers may
            collect and process your data according to their own policies.
          </p>

          <h3>6. Sharing of Information</h3>
          <p>
            We do not sell your personal data. We may share information with
            trusted third-party service providers only where necessary to
            operate the platform, process payments, or comply with legal
            obligations.
          </p>

          <h3>7. Data Security</h3>
          <p>
            We implement appropriate technical and organizational measures to
            protect your data against unauthorized access, loss, misuse, or
            alteration. However, no system can be guaranteed to be completely
            secure.
          </p>

          <h3>8. Data Retention</h3>
          <p>
            We retain your information only for as long as necessary to fulfill
            the purposes outlined in this policy, including legal, accounting,
            and operational requirements.
          </p>

          <h3>9. Cookies and Tracking Technologies</h3>
          <p>
            We may use cookies and similar technologies to enhance your
            experience, analyze usage patterns, and improve our services. You
            can control cookie settings through your browser.
          </p>

          <h3>10. User Rights</h3>
          <p>
            You may request access to your personal data, request correction or
            deletion, or object to certain processing activities, subject to
            applicable laws.
          </p>

          <h3>11. Third-Party Links</h3>
          <p>
            The platform may contain links to third-party websites. We are not
            responsible for the privacy practices or content of those external
            sites.
          </p>

          <h3>12. Children’s Privacy</h3>
          <p>
            Rebetas is not intended for individuals under the age of 18. We do
            not knowingly collect personal data from minors.
          </p>

          <h3>13. International Data Transfers</h3>
          <p>
            Your information may be processed in countries outside your own. By
            using the platform, you consent to such transfers where necessary.
          </p>

          <h3>14. Updates to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. Continued use
            of the platform after changes constitutes acceptance of the updated
            policy.
          </p>

          <h3>15. Contact Information</h3>
          <p>
            If you have questions regarding this Privacy Policy, you may contact
            us at:
            <br />
            <br />
            info@rebetas.com
            <br />
            support@rebetas.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
