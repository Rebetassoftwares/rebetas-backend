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

  // ⏱️ COUNTDOWN TIMER
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
      [name]: value,
    }));
  }

  // 📧 MASK EMAIL
  function maskEmail(email) {
    if (!email) return "";

    const [name, domain] = email.split("@");

    if (!name || !domain) return email;

    const firstChar = name[0];
    const hidden = "*".repeat(Math.max(name.length - 1, 3));

    return `${firstChar}${hidden}@${domain}`;
  }

  // 🔢 OTP INPUT HANDLER
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

  // 📋 PASTE SUPPORT
  function handlePaste(e) {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;

    const newOtp = paste.split("");
    setOtpArray(newOtp);

    inputsRef.current[5].focus();
  }

  const otp = otpArray.join("");

  // 🚀 STEP 1 → LOGIN
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/user/login", formData);

      setUserId(res.userId);
      setUserEmail(res.email); // ✅ IMPORTANT
      setStep("otp");

      setCountdown(60);

      setSuccess("Verification code sent to your email");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // 🔐 STEP 2 → VERIFY OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();

    if (otp.length !== 6) {
      return setError("Enter complete 6-digit code");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/user/verify-login-otp", {
        userId,
        otp,
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

  // 🔁 RESEND OTP
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

  return (
    <div className="login-page">
      <Navbar />

      <section className="login-section">
        <div className="container login-layout">
          <div className="login-info">
            <h1>Welcome Back</h1>
            <p>
              Access AI-powered virtual football predictions designed to help
              you make smarter betting decisions.
            </p>
          </div>

          <div className="login-card">
            {/* LOGIN STEP */}
            {step === "login" && (
              <>
                <h2>Login to Rebetas</h2>

                <form className="login-form" onSubmit={handleLogin}>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                  />

                  <div className="password-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      onChange={handleChange}
                    />
                    <span onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "🙈" : "👁️"}
                    </span>
                  </div>

                  {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
                  {success && <p style={{ color: "#22c55e" }}>{success}</p>}

                  <button type="submit" disabled={loading}>
                    {loading ? "Sending code..." : "Continue"}
                  </button>
                </form>
              </>
            )}

            {/* OTP STEP */}
            {step === "otp" && (
              <>
                <h2>Enter Verification Code</h2>

                {/* 📧 EMAIL DISPLAY */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#888",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  Code sent to{" "}
                  <span style={{ color: "#a855f7", fontWeight: "600" }}>
                    {maskEmail(userEmail)}
                  </span>
                </p>

                {/* 🔁 CHANGE ACCOUNT */}
                <p
                  style={{
                    fontSize: "13px",
                    color: "#a855f7",
                    cursor: "pointer",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                  onClick={() => {
                    setStep("login");
                    setOtpArray(["", "", "", "", "", ""]);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Change account
                </p>

                <form className="login-form" onSubmit={handleVerifyOtp}>
                  <div className="otp-container" onPaste={handlePaste}>
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputsRef.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="otp-input"
                      />
                    ))}
                  </div>

                  {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
                  {success && <p style={{ color: "#22c55e" }}>{success}</p>}

                  <button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </form>

                {/* ⏱️ RESEND */}
                <p
                  style={{
                    marginTop: "10px",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    color: countdown > 0 ? "#999" : "#a855f7",
                    textAlign: "center",
                  }}
                  onClick={handleResendOtp}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                </p>
              </>
            )}

            <p className="login-register">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
