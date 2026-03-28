import Navbar from "../../components/Navbar/Navbar";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import Footer from "../../components/Footer/Footer";
import "./Legal.css";

export default function Terms() {
  const token = localStorage.getItem("rebetas_token");
  const isLoggedIn = !!token;

  return (
    <div className="legal-page">
      {isLoggedIn ? <DashboardNavbar /> : <Navbar />}

      <section className="legal-hero">
        <div className="container legal-hero-content">
          <span className="legal-tag">LEGAL</span>
          <h1>Terms & Conditions</h1>
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
            Welcome to Rebetas. These Terms and Conditions govern your access to
            and use of the Rebetas platform, including all services, features,
            content, tools, and functionality made available through our website
            and related applications. By registering an account, accessing the
            platform, or using any part of the service, you agree to be legally
            bound by these Terms. If you do not agree with these Terms, you must
            not access or use the platform.
          </p>

          <h3>1. Introduction</h3>
          <p>
            Rebetas is a virtual football prediction platform designed to
            provide users with access to curated prediction signals, performance
            records, platform support information, and subscription-based
            content. These Terms form a binding agreement between you and
            Rebetas and apply to all users of the platform, whether as visitors,
            registered users, or paying subscribers.
          </p>

          <h3>2. Eligibility</h3>
          <p>
            By using Rebetas, you represent and warrant that you are at least 18
            years old, or the minimum legal age required in your jurisdiction to
            engage with betting-related informational services, whichever is
            higher. You further confirm that you have the legal capacity to
            enter into a binding agreement and that your use of the platform
            does not violate any law, regulation, or rule applicable in your
            country or territory.
          </p>

          <h3>3. Service Description</h3>
          <p>
            Rebetas provides virtual football prediction signals and related
            informational content. The platform may include, without limitation,
            single-match predictions, market selections, platform-specific
            signal delivery, historical performance information, tutorials,
            system notifications, and subscription access controls. All services
            are provided strictly for informational and entertainment purposes.
            Rebetas does not operate as a bookmaker, gambling operator, or
            financial institution.
          </p>

          <h3>4. No Guarantee of Results</h3>
          <p>
            You expressly acknowledge and agree that Rebetas does not guarantee
            any winnings, profits, returns, or successful betting outcomes. Any
            prediction, signal, suggestion, or historical record displayed on
            the platform does not constitute a promise or assurance of future
            performance. Betting and wagering involve significant risk, and you
            accept full responsibility for any financial loss, damage, or
            adverse outcome resulting from your reliance on or use of the
            platform.
          </p>

          <h3>5. No Financial, Investment, or Gambling Advice</h3>
          <p>
            The content made available on Rebetas does not constitute financial
            advice, investment advice, legal advice, or gambling advice. Nothing
            on the platform should be interpreted as a recommendation to stake a
            specific amount, pursue a particular betting strategy, or make any
            financial commitment. All decisions made by users are made
            voluntarily and entirely at their own risk.
          </p>

          <h3>6. User Responsibility</h3>
          <p>
            You are solely responsible for your use of the platform and for any
            decisions you make based on information obtained from Rebetas. You
            agree to use the platform responsibly, lawfully, and with personal
            discipline. You further acknowledge that Rebetas shall not be liable
            for any loss of funds, betting losses, missed opportunities,
            emotional distress, business interruption, or any other direct or
            indirect consequence arising from your use of the service.
          </p>

          <h3>7. Account Registration and Account Security</h3>
          <p>
            Certain features of the platform require account registration. When
            creating an account, you agree to provide accurate, complete, and
            current information. You are responsible for safeguarding your login
            credentials and for all activities that occur under your account. If
            you suspect unauthorized access, compromise, or misuse of your
            account, you must notify Rebetas immediately. We reserve the right
            to suspend, restrict, or terminate any account where suspicious
            activity, false information, or misuse is detected.
          </p>

          <h3>8. Subscription and Payments</h3>
          <p>
            Access to certain parts of the platform may require an active paid
            subscription. Subscription plans, features, pricing, billing periods
            , and supported currencies may be displayed on the platform and may
            be updated from time to time. By making payment, you authorize the
            processing of such payment through our supported payment providers.
            Subscription access is granted only after successful payment
            confirmation and remains valid for the applicable subscription
            period.
          </p>

          <h3>9. Payment Processing and Third-Party Providers</h3>
          <p>
            Payments made on Rebetas may be processed through third-party
            payment providers. By making payment, you acknowledge that such
            providers may apply their own terms, conditions, policies, and
            operational procedures. Rebetas does not control and is not
            responsible for the independent acts, omissions, delays, failures,
            or technical issues of any payment processor, card issuer, bank, or
            related third party involved in the transaction process.
          </p>

          <h3>10. Refund Policy</h3>
          <p>
            Except where otherwise required by applicable law, all payments made
            to Rebetas are final, non-refundable, and non-transferable. This
            includes completed subscription purchases, renewals, and any other
            paid access fees. Users are advised to review plan details carefully
            before making payment. Rebetas reserves the right, but not the
            obligation, to consider exceptional cases at its sole discretion.
          </p>

          <h3>11. Fair Use and Content Restrictions</h3>
          <p>
            You agree not to copy, reproduce, distribute, broadcast, publish,
            transmit, modify, scrape, resell, sublicense, or commercially
            exploit any content or service obtained from Rebetas without prior
            written authorization. This includes prediction signals, historical
            records, platform data, branding elements, written content, and
            other proprietary material. Any unauthorized sharing, resale, group
            redistribution, or misuse of subscription content may result in
            immediate account termination and further legal action where
            appropriate.
          </p>

          <h3>12. Intellectual Property</h3>
          <p>
            All rights, title, and interest in and to the Rebetas platform,
            including its name, brand assets, design, layout, interface,
            graphics, written content, features, source materials, and related
            intellectual property, remain the exclusive property of Rebetas or
            its licensors. Nothing in these Terms grants you any ownership
            rights or license except the limited right to access and use the
            platform in accordance with these Terms.
          </p>

          <h3>13. Prohibited Conduct</h3>
          <p>
            In using Rebetas, you agree not to engage in any activity that may
            harm the platform, its users, or its operations. Prohibited conduct
            includes, without limitation, attempting unauthorized access to the
            platform, using automated systems or bots, interfering with the
            service, bypassing access restrictions, impersonating another
            person, engaging in fraud, distributing harmful code, reverse
            engineering any part of the system, or using the platform for any
            unlawful purpose.
          </p>

          <h3>14. Suspension and Termination</h3>
          <p>
            Rebetas reserves the right to suspend, restrict, or terminate your
            access to the platform at any time, with or without prior notice,
            where we reasonably believe that you have violated these Terms,
            misused the service, engaged in suspicious activity, compromised the
            integrity of the platform, or created risk for Rebetas or other
            users. Termination or suspension shall not affect any rights or
            remedies available to Rebetas under applicable law.
          </p>

          <h3>15. Availability of Service</h3>
          <p>
            While we aim to provide reliable access to the platform, Rebetas
            does not guarantee uninterrupted availability, continuous access, or
            error-free operation. The platform may be unavailable from time to
            time due to maintenance, updates, technical failures, third-party
            provider issues, internet disruptions, or circumstances beyond our
            control. We shall not be liable for any loss or inconvenience caused
            by service interruption or system downtime.
          </p>

          <h3>16. Disclaimer of Warranties</h3>
          <p>
            The platform and all content made available through it are provided
            on an “as is” and “as available” basis, without warranties,
            guarantees, conditions, or representations of any kind, whether
            express or implied. To the fullest extent permitted by law, Rebetas
            disclaims all warranties including, without limitation, warranties
            of merchantability, fitness for a particular purpose, accuracy,
            reliability, non-infringement, and uninterrupted availability.
          </p>

          <h3>17. Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by applicable law, Rebetas, its
            owners, directors, officers, employees, affiliates, contractors, and
            partners shall not be liable for any direct, indirect, incidental,
            consequential, special, exemplary, or punitive damages arising out
            of or related to your access to or use of the platform. This
            limitation includes, without limitation, financial loss, betting
            losses, loss of profits, loss of data, loss of goodwill, business
            interruption, and any other commercial or personal loss.
          </p>

          <h3>18. Indemnity</h3>
          <p>
            You agree to indemnify, defend, and hold harmless Rebetas and its
            affiliates, officers, employees, agents, and partners from and
            against any claim, demand, liability, damage, judgment, settlement,
            loss, cost, or expense, including reasonable legal fees, arising out
            of or related to your use of the platform, your breach of these
            Terms, your violation of law, or your infringement of any rights of
            another person or entity.
          </p>

          <h3>19. Third-Party Links and Services</h3>
          <p>
            The platform may contain links to third-party websites, services, or
            providers for convenience or operational purposes. Rebetas does not
            endorse, control, or assume responsibility for the content,
            availability, security, or practices of any third-party site or
            service. Access to such third-party resources is at your own risk.
          </p>

          <h3>20. Privacy</h3>
          <p>
            Your use of the platform is also subject to our Privacy Policy,
            which explains how we collect, use, store, and protect your
            information. By using Rebetas, you acknowledge that you have read
            and understood our Privacy Policy.
          </p>

          <h3>21. Modifications to These Terms</h3>
          <p>
            Rebetas reserves the right to amend, revise, replace, or update
            these Terms at any time at its sole discretion. Where changes are
            made, the updated version may be posted on the platform with a
            revised effective date. Your continued use of the platform after any
            such change constitutes your acceptance of the updated Terms.
          </p>

          <h3>22. Governing Law</h3>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the Federal Republic of Nigeria, without regard to its
            conflict of law principles.
          </p>

          <h3>23. Dispute Resolution</h3>
          <p>
            Any dispute, controversy, or claim arising out of or relating to
            these Terms or your use of the platform shall first be addressed
            through good-faith discussions between the parties. Where such
            discussions fail to resolve the matter, the dispute shall be subject
            to the jurisdiction of the competent courts within Nigeria, unless
            otherwise required by applicable law.
          </p>

          <h3>24. Severability</h3>
          <p>
            If any provision of these Terms is held to be invalid, unlawful, or
            unenforceable, that provision shall be deemed severed to the minimum
            extent necessary, and the remaining provisions shall remain in full
            force and effect.
          </p>

          <h3>25. Entire Agreement</h3>
          <p>
            These Terms, together with any policies or legal notices expressly
            incorporated by reference, constitute the entire agreement between
            you and Rebetas concerning your use of the platform and supersede
            any prior or contemporaneous understandings, communications, or
            agreements on the subject matter.
          </p>

          <h3>26. Contact Information</h3>
          <p>
            If you have any questions, notices, complaints, or requests
            regarding these Terms, you may contact us at:
            <br />
            <br />
            info@rebetas.com
            <br />
            support@rebetas.com
          </p>

          <h3>27. Acceptance</h3>
          <p>
            By creating an account, subscribing to the service, or continuing to
            access or use Rebetas, you confirm that you have read, understood,
            and agreed to be legally bound by these Terms and Conditions.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
