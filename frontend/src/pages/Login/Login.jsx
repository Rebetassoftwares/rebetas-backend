import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Login.css";
import api from "../../services/api";
import { saveAuth } from "../../utils/auth";

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("login");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const inputsRef = useRef([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotBox, setShowForgotBox] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "username" ? value.trimStart().toLowerCase() : value,
    }));
  }

  function maskEmail(email) {
    if (!email) return "";

    const [name, domain] = email.split("@");

    if (!name || !domain) return email;

    const firstChar = name[0];
    const hidden = "*".repeat(Math.max(name.length - 1, 3));

    return `${firstChar}${hidden}@${domain}`;
  }

  function getDeviceToken() {
    let token = localStorage.getItem("device_token");

    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("device_token", token);
    }

    return token;
  }

  function handleOtpChange(value, index) {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;

    const newOtp = paste.split("");
    setOtpArray(newOtp);

    inputsRef.current[5].focus();
  }

  const otp = otpArray.join("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const deviceToken = getDeviceToken();

      const res = await api.post("/user/login", {
        ...formData,
        deviceToken,
      });

      if (res.token && res.user) {
        saveAuth(res);

        const role = res?.user?.role;

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }

        return;
      }

      setUserId(res.userId);
      setUserEmail(res.email);
      setStep("otp");
      setCountdown(60);
      setSuccess("Verification code sent to your email");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();

    if (otp.length !== 6) {
      return setError("Enter complete 6-digit code");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const deviceToken = getDeviceToken();

      const res = await api.post("/user/verify-login-otp", {
        userId,
        otp,
        deviceToken,
      });

      saveAuth(res);

      setSuccess("Login successful 🎉");

      console.log("verify-login-otp response:", res);
      console.log(
        "stored user after saveAuth:",
        JSON.parse(localStorage.getItem("rebetas_user")),
      );

      const role = res?.user?.role;

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;

    try {
      await api.post("/user/resend-login-otp", { userId });

      setCountdown(60);
      setSuccess("New code sent");
      setOtpArray(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) {
      return setError("Enter your email address");
    }

    setForgotLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/user/forgot-password", {
        email: forgotEmail,
      });

      setSuccess(res.message);
      setForgotEmail("");
      setShowForgotBox(false);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Navbar />

      <section className="login-section">
        <div className="container login-layout">
          <div className="login-info">
            <span className="login-eyebrow">SUNSTREAMERS ACCESS</span>

            <h1>
              Welcome
              <span> Back.</span>
            </h1>

            <p>
              Your SunStreamers experience continues here. Sign in to access
              your dashboard, explore available virtual football prediction
              signals and manage your account.
            </p>

            <div className="login-feature-list">
              <div className="login-feature">
                <span>✓</span>
                <p>Access your personal dashboard</p>
              </div>

              <div className="login-feature">
                <span>✓</span>
                <p>View available prediction signals</p>
              </div>

              <div className="login-feature">
                <span>✓</span>
                <p>Manage your account and subscription</p>
              </div>
            </div>

            <div className="login-performance">
              <strong>85%</strong>
              <div>
                <span>Reported winning rate</span>
              </div>
            </div>
          </div>

          <div className="login-card">
            {step === "login" && (
              <>
                <div className="login-card-heading">
                  <span className="login-card-kicker">MEMBER ACCESS</span>

                  <h2>Login to SunStreamers</h2>

                  <p>Enter your account details to continue.</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                  <div className="login-field">
                    <label htmlFor="login-username">Username or email</label>

                    <input
                      id="login-username"
                      type="text"
                      name="username"
                      placeholder="Enter username or email"
                      value={formData.username}
                      onChange={handleChange}
                      autoComplete="username"
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="login-password">Password</label>

                    <div className="password-group">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                      />

                      <span onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "🙈" : "👁️"}
                      </span>
                    </div>
                  </div>

                  <div className="forgot-password-row">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotBox((prev) => !prev);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {showForgotBox && (
                    <div className="forgot-password-box">
                      <div>
                        <strong>Reset your password</strong>
                        <p>
                          Enter the email address associated with your account.
                        </p>
                      </div>

                      <input
                        type="email"
                        placeholder="Enter your account email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        autoComplete="email"
                      />

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={forgotLoading}
                        className="forgot-password-send"
                      >
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  )}

                  {error && <p className="login-error">{error}</p>}
                  {success && <p className="login-success">{success}</p>}

                  <button type="submit" disabled={loading}>
                    {loading ? "Sending code..." : "Continue"}
                    {!loading && <span>→</span>}
                  </button>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="login-card-heading">
                  <span className="login-card-kicker">ACCOUNT SECURITY</span>

                  <h2>Verify Your Login</h2>

                  <p>
                    Enter the six-digit verification code sent to your email.
                  </p>
                </div>

                <div className="otp-email-display">
                  Code sent to <strong>{maskEmail(userEmail)}</strong>
                </div>

                <button
                  type="button"
                  className="change-account"
                  onClick={() => {
                    setStep("login");
                    setOtpArray(["", "", "", "", "", ""]);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ← Change account
                </button>

                <form className="login-form" onSubmit={handleVerifyOtp}>
                  <div className="otp-container" onPaste={handlePaste}>
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputsRef.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="otp-input"
                        aria-label={`Verification digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  {error && <p className="login-error">{error}</p>}
                  {success && <p className="login-success">{success}</p>}

                  <button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"}
                    {!loading && <span>→</span>}
                  </button>
                </form>

                <button
                  type="button"
                  className={`resend-code ${countdown > 0 ? "disabled" : ""}`}
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Resend verification code"}
                </button>
              </>
            )}

            <p className="login-register">
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
