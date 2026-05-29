import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AutoPilotGuide.css";

export default function AutoPilotGuide() {
  return (
    <div className="autopilot-guide-page">
      <Navbar />

      <section className="guide-hero">
        <div className="container">
          <span className="guide-badge">Rebetas AutoPilot AI System</span>

          <h1>Rebetas AutoPilot Guide</h1>

          <p>
            Learn how daily profit credits, compounding, referral earnings, and
            withdrawals work inside the Rebetas AutoPilot AI system.
          </p>
        </div>
      </section>

      <section className="guide-content">
        <div className="container">
          {/* WELCOME */}

          <div className="guide-card">
            <h2>Welcome to Rebetas AutoPilot</h2>

            <p>
              AutoPilot is designed for users who want to earn from Rebetas
              without having to follow predictions, monitor matches, or place
              selections themselves every day.
            </p>

            <p>
              Once you activate an AutoPilot package, Rebetas handles the daily
              activities while profits are credited directly to your AutoPilot
              account.
            </p>

            <p>Your job is simple:</p>

            <ul>
              <li>Activate a package</li>
              <li>Monitor your dashboard</li>
              <li>Withdraw profits when needed</li>
              <li>Compound profits to grow your account</li>
              <li>Earn referral commissions</li>
              <li>Build your Capital Balance over time</li>
            </ul>
          </div>

          {/* WHY AUTOPILOT */}

          <div className="guide-card">
            <h2>Why Users Choose AutoPilot</h2>

            <p>
              Many users don't have the time to monitor predictions every day.
            </p>

            <p>AutoPilot was created to provide a simpler experience.</p>

            <p>
              Instead of managing predictions yourself, your AutoPilot account
              works in the background while profits are credited to your account
              daily.
            </p>

            <p>
              You remain in control of your money at all times through your
              dashboard.
            </p>
          </div>

          {/* PACKAGE RATES */}

          <div className="guide-card">
            <h2>AutoPilot Packages & Daily Profit Rates</h2>

            <p>Every AutoPilot package has its own daily profit rate.</p>

            <p>
              The higher the package, the higher the daily profit percentage.
            </p>

            <p>Current package rates:</p>

            <div className="package-grid">
              <div className="package-card">
                <h3>Starter Package</h3>
                <span>1.7%</span>
                <small>Daily Profit Rate</small>
              </div>

              <div className="package-card">
                <h3>Bronze Package</h3>
                <span>2.0%</span>
                <small>Daily Profit Rate</small>
              </div>

              <div className="package-card">
                <h3>Silver Package</h3>
                <span>2.3%</span>
                <small>Daily Profit Rate</small>
              </div>

              <div className="package-card">
                <h3>Gold Package</h3>
                <span>2.5%</span>
                <small>Daily Profit Rate</small>
              </div>

              <div className="package-card">
                <h3>Diamond Package</h3>
                <span>3.0%</span>
                <small>Daily Profit Rate</small>
              </div>
            </div>

            <p>Daily profits are credited directly into your Profit Balance.</p>
          </div>

          {/* DAILY PROFIT */}

          <div className="guide-card">
            <h2>How Daily Profit Works</h2>

            <p>
              Your daily profit is calculated from your current Capital Balance.
            </p>

            <div className="example-box">
              <h4>Example</h4>

              <p>Starter Package</p>

              <p>Capital Balance = ₦60,000</p>

              <p>Daily Profit Rate = 1.7%</p>

              <p>Expected Daily Profit = ₦1,020</p>
            </div>

            <p>That profit is credited to your Profit Balance.</p>

            <p>
              If your Capital Balance increases through compounding, future
              profits are calculated using the new Capital Balance.
            </p>

            <p>
              This means larger Capital Balances can generate larger daily
              profit credits.
            </p>
          </div>

          {/* HOW IT WORKS */}

          <div className="guide-card">
            <h2>How AutoPilot Works</h2>

            <div className="steps-grid">
              <div className="step-card">
                <span>1</span>
                <p>Choose an AutoPilot package.</p>
              </div>

              <div className="step-card">
                <span>2</span>
                <p>Complete payment.</p>
              </div>

              <div className="step-card">
                <span>3</span>
                <p>Your payment is verified.</p>
              </div>

              <div className="step-card">
                <span>4</span>
                <p>Your AutoPilot account becomes active.</p>
              </div>

              <div className="step-card">
                <span>5</span>
                <p>Daily profits begin entering your Profit Balance.</p>
              </div>

              <div className="step-card">
                <span>6</span>
                <div>
                  <p>You can:</p>

                  <ul>
                    <li>Withdraw profits</li>
                    <li>Compound profits</li>
                    <li>Earn referral commissions</li>
                    <li>Compound referral commissions</li>
                    <li>Withdraw referral earnings</li>
                    <li>Withdraw capital when eligible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD */}

          <div className="guide-card">
            <h2>Understanding Your Dashboard</h2>

            <p>Your AutoPilot dashboard contains three important balances.</p>

            <div className="balance-grid">
              <div className="balance-card">
                <h3>Capital Balance</h3>

                <p>
                  Capital Balance is the amount currently working inside your
                  AutoPilot account.
                </p>

                <p>It includes:</p>

                <ul>
                  <li>Your original package amount</li>
                  <li>Compounded profits</li>
                  <li>Compounded referral earnings</li>
                </ul>

                <div className="example-box">
                  <p>Starter Package = ₦60,000</p>
                  <p>Capital Balance = ₦60,000</p>
                  <p>Compound ₦10,000 profit</p>
                  <p>Capital Balance = ₦70,000</p>
                  <p>Compound ₦5,000 referral earnings</p>
                  <p>Capital Balance = ₦75,000</p>
                </div>

                <p>
                  Your daily profit is calculated from this Capital Balance.
                </p>
              </div>

              <div className="balance-card">
                <h3>Profit Balance</h3>

                <p>
                  Profit Balance contains the profits earned by your own
                  AutoPilot account.
                </p>

                <div className="example-box">
                  <p>Capital Balance = ₦75,000</p>
                  <p>Daily Profit Credit = ₦2,500</p>
                  <p>Profit Balance = ₦2,500</p>

                  <hr />

                  <p>The next day:</p>

                  <p>Daily Profit Credit = ₦3,000</p>
                  <p>Profit Balance = ₦5,500</p>
                </div>

                <p>You can:</p>

                <ul>
                  <li>Withdraw it</li>
                  <li>Compound it</li>
                </ul>
              </div>

              <div className="balance-card">
                <h3>Referral Balance</h3>

                <p>
                  Referral Balance contains commissions earned from users you
                  referred.
                </p>

                <p>
                  Referral earnings are completely separate from your Profit
                  Balance.
                </p>

                <div className="example-box">
                  <p>Profit Balance = ₦8,000</p>
                  <p>Referral Balance = ₦3,500</p>
                </div>

                <p>These are two separate balances.</p>
              </div>
            </div>
          </div>

          {/* REFERRALS */}

          <div className="guide-card">
            <h2>How Referrals Work</h2>

            <p>Every Rebetas user receives:</p>

            <ul>
              <li>A referral link</li>
              <li>A referral code</li>
            </ul>

            <p>
              When someone registers using your referral link or referral code,
              that user becomes your referral.
            </p>

            <p>
              If the referred user activates AutoPilot and receives daily
              profit, you earn 10% of that daily profit.
            </p>

            <div className="example-box">
              <h4>Example</h4>

              <p>You refer John.</p>

              <p>John receives:</p>

              <p>₦5,000 daily profit</p>

              <p>You receive:</p>

              <p>₦500 referral commission</p>
            </div>

            <p>That ₦500 is credited to your Referral Balance.</p>

            <p>
              The more active referrals you have, the more referral earnings you
              can generate.
            </p>
          </div>

          {/* COMPOUNDING */}

          <div className="guide-card">
            <h2>What Is Compounding?</h2>

            <p>
              Compounding means moving money from your Profit Balance or
              Referral Balance into your Capital Balance.
            </p>

            <p>Instead of withdrawing the money, you put it back to work.</p>

            <p>
              Many users compound because it helps increase their Capital
              Balance.
            </p>

            <p>
              A higher Capital Balance can result in larger future profit
              credits.
            </p>
          </div>

          {/* COMPOUNDING EXAMPLE */}

          <div className="guide-card">
            <h2>Example Of Compounding</h2>

            <div className="example-box">
              <p>You activate Starter Package:</p>

              <p>Capital Balance = ₦60,000</p>

              <p>Profit Balance grows to:</p>

              <p>₦10,000</p>
            </div>

            <p>You have two choices.</p>

            <div className="comparison-grid">
              <div className="comparison-card">
                <h3>Option 1: Withdraw</h3>

                <p>Withdraw ₦10,000</p>

                <p>Capital Balance remains:</p>

                <p>₦60,000</p>

                <p>Future profits continue to be calculated from ₦60,000.</p>
              </div>

              <div className="comparison-card">
                <h3>Option 2: Compound</h3>

                <p>Compound ₦10,000</p>

                <p>Capital Balance becomes:</p>

                <p>₦70,000</p>

                <p>
                  Future profits are now calculated from ₦70,000 instead of
                  ₦60,000.
                </p>
              </div>
            </div>

            <p>This is why many users compound their profits regularly.</p>

            <p>The same process applies to Referral Balance.</p>
          </div>

          {/* PROFIT WITHDRAWAL */}

          <div className="guide-card">
            <h2>Profit Withdrawal</h2>

            <p>
              Profit Withdrawal allows you to withdraw money from your Profit
              Balance.
            </p>

            <div className="example-box">
              <h4>Example</h4>

              <p>Profit Balance = ₦20,000</p>

              <p>Withdraw = ₦10,000</p>

              <p>Remaining Profit Balance = ₦10,000</p>
            </div>

            <p>Capital Balance remains unchanged.</p>
          </div>

          {/* REFERRAL WITHDRAWAL */}

          <div className="guide-card">
            <h2>Referral Withdrawal</h2>

            <p>
              Referral Withdrawal allows you to withdraw money from your
              Referral Balance.
            </p>

            <div className="example-box">
              <h4>Example</h4>

              <p>Referral Balance = ₦15,000</p>

              <p>Withdraw = ₦10,000</p>

              <p>Remaining Referral Balance = ₦5,000</p>
            </div>

            <p>Capital Balance remains unchanged.</p>
          </div>

          {/* CAPITAL WITHDRAWAL */}

          <div className="guide-card warning-card">
            <h2>Capital Withdrawal</h2>

            <p>
              Capital Withdrawal allows you to withdraw the money currently
              inside your Capital Balance.
            </p>

            <p>This includes:</p>

            <ul>
              <li>Original package amount</li>
              <li>Compounded profits</li>
              <li>Compounded referral earnings</li>
            </ul>
          </div>

          {/* CAPITAL RULE */}

          <div className="guide-card warning-card">
            <h2>Important Capital Withdrawal Rule</h2>

            <p>
              You cannot withdraw your capital until 30 days have passed since
              your last compounding activity.
            </p>

            <p>
              Every time you compound profits or referral earnings, the 30-day
              waiting period starts again.
            </p>

            <div className="example-box">
              <h4>Example</h4>

              <p>January 1</p>

              <p>You compound ₦10,000</p>

              <p>Earliest Capital Withdrawal Date:</p>

              <p>January 31</p>

              <hr />

              <p>If you compound again on January 20:</p>

              <p>New Earliest Capital Withdrawal Date:</p>

              <p>February 19</p>
            </div>
          </div>

          {/* AFTER CAPITAL WITHDRAWAL */}

          <div className="guide-card warning-card">
            <h2>What Happens After Capital Withdrawal?</h2>

            <p>Once your Capital Withdrawal is approved:</p>

            <ul>
              <li>Your AutoPilot account is closed</li>
              <li>Daily profit credits stop</li>
              <li>Future AutoPilot earnings stop</li>
              <li>
                You will need to activate a new package if you wish to
                participate again
              </li>
            </ul>
          </div>

          {/* FAQ */}

          <div className="guide-card">
            <h2>Frequently Asked Questions</h2>

            <div className="faq-item">
              <h3>Do I need to place predictions myself?</h3>

              <p>
                No. Rebetas handles the daily activities for AutoPilot accounts.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I withdraw my profits anytime?</h3>

              <p>
                Yes. You can request a profit withdrawal whenever you have
                available Profit Balance.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I withdraw my referral earnings anytime?</h3>

              <p>
                Yes. You can request a referral withdrawal whenever you have
                available Referral Balance.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I compound my profits?</h3>

              <p>Yes. Profit Balance can be compounded into Capital Balance.</p>
            </div>

            <div className="faq-item">
              <h3>Can I compound my referral earnings?</h3>

              <p>
                Yes. Referral Balance can be compounded into Capital Balance.
              </p>
            </div>

            <div className="faq-item">
              <h3>Does compounding increase future profits?</h3>

              <p>
                It can. Because profits are calculated from your Capital
                Balance, increasing your Capital Balance can increase future
                profit credits.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I withdraw my capital anytime?</h3>

              <p>
                No. You must wait at least 30 days after your most recent
                compounding activity.
              </p>
            </div>

            <div className="faq-item">
              <h3>Does compounding affect Capital Withdrawal eligibility?</h3>

              <p>
                Yes. Every time you compound, the 30-day waiting period starts
                again.
              </p>
            </div>

            <div className="faq-item">
              <h3>Does Capital Withdrawal close my AutoPilot account?</h3>

              <p>
                Yes. Once a Capital Withdrawal is approved, the AutoPilot
                account is closed.
              </p>
            </div>

            <div className="faq-item">
              <h3>
                Is AutoPilot different from the normal Rebetas subscription?
              </h3>

              <p>
                Yes. The normal Rebetas subscription gives you access to
                predictions.
              </p>

              <p>
                AutoPilot is a separate feature where Rebetas handles the daily
                activities while profits are credited directly to your AutoPilot
                account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
