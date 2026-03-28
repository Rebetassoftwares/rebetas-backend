import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import "./Register.css";
import api from "../../services/api";

/* 🌍 COUNTRIES (AFRICA + GLOBAL) */

const COUNTRIES = [
  { name: "United States", code: "US", dial: "+1" },
  { name: "Antigua and Barbuda", code: "AG", dial: "+1" },
  { name: "Bahamas", code: "BS", dial: "+1" },
  { name: "Barbados", code: "BB", dial: "+1" },
  { name: "Belize", code: "BZ", dial: "+501" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Costa Rica", code: "CR", dial: "+506" },
  { name: "Cuba", code: "CU", dial: "+53" },
  { name: "Dominica", code: "DM", dial: "+1" },
  { name: "Dominican Republic", code: "DO", dial: "+1" },
  { name: "El Salvador", code: "SV", dial: "+503" },
  { name: "Grenada", code: "GD", dial: "+1" },
  { name: "Guatemala", code: "GT", dial: "+502" },
  { name: "Haiti", code: "HT", dial: "+509" },
  { name: "Honduras", code: "HN", dial: "+504" },
  { name: "Jamaica", code: "JM", dial: "+1" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Nicaragua", code: "NI", dial: "+505" },
  { name: "Panama", code: "PA", dial: "+507" },
  { name: "Saint Kitts and Nevis", code: "KN", dial: "+1" },
  { name: "Saint Lucia", code: "LC", dial: "+1" },
  { name: "Saint Vincent and the Grenadines", code: "VC", dial: "+1" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1" },

  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Bolivia", code: "BO", dial: "+591" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Ecuador", code: "EC", dial: "+593" },
  { name: "Guyana", code: "GY", dial: "+592" },
  { name: "Paraguay", code: "PY", dial: "+595" },
  { name: "Peru", code: "PE", dial: "+51" },
  { name: "Suriname", code: "SR", dial: "+597" },
  { name: "Uruguay", code: "UY", dial: "+598" },
  { name: "Venezuela", code: "VE", dial: "+58" },

  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Fiji", code: "FJ", dial: "+679" },
  { name: "Kiribati", code: "KI", dial: "+686" },
  { name: "Marshall Islands", code: "MH", dial: "+692" },
  { name: "Micronesia", code: "FM", dial: "+691" },
  { name: "Nauru", code: "NR", dial: "+674" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Palau", code: "PW", dial: "+680" },
  { name: "Papua New Guinea", code: "PG", dial: "+675" },
  { name: "Samoa", code: "WS", dial: "+685" },
  { name: "Solomon Islands", code: "SB", dial: "+677" },
  { name: "Tonga", code: "TO", dial: "+676" },
  { name: "Tuvalu", code: "TV", dial: "+688" },
  { name: "Vanuatu", code: "VU", dial: "+678" },

  { name: "Albania", code: "AL", dial: "+355" },
  { name: "Andorra", code: "AD", dial: "+376" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Belarus", code: "BY", dial: "+375" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387" },
  { name: "Bulgaria", code: "BG", dial: "+359" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Czech Republic", code: "CZ", dial: "+420" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Estonia", code: "EE", dial: "+372" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Hungary", code: "HU", dial: "+36" },
  { name: "Iceland", code: "IS", dial: "+354" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Kosovo", code: "XK", dial: "+383" },
  { name: "Latvia", code: "LV", dial: "+371" },
  { name: "Liechtenstein", code: "LI", dial: "+423" },
  { name: "Lithuania", code: "LT", dial: "+370" },
  { name: "Luxembourg", code: "LU", dial: "+352" },
  { name: "Malta", code: "MT", dial: "+356" },
  { name: "Moldova", code: "MD", dial: "+373" },
  { name: "Monaco", code: "MC", dial: "+377" },
  { name: "Montenegro", code: "ME", dial: "+382" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "North Macedonia", code: "MK", dial: "+389" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Romania", code: "RO", dial: "+40" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "San Marino", code: "SM", dial: "+378" },
  { name: "Serbia", code: "RS", dial: "+381" },
  { name: "Slovakia", code: "SK", dial: "+421" },
  { name: "Slovenia", code: "SI", dial: "+386" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Ukraine", code: "UA", dial: "+380" },
  { name: "United Kingdom", code: "GB", dial: "+44" },

  { name: "Algeria", code: "DZ", dial: "+213" },
  { name: "Angola", code: "AO", dial: "+244" },
  { name: "Benin", code: "BJ", dial: "+229" },
  { name: "Botswana", code: "BW", dial: "+267" },
  { name: "Burkina Faso", code: "BF", dial: "+226" },
  { name: "Burundi", code: "BI", dial: "+257" },
  { name: "Cape Verde", code: "CV", dial: "+238" },
  { name: "Cameroon", code: "CM", dial: "+237" },
  { name: "Central African Republic", code: "CF", dial: "+236" },
  { name: "Chad", code: "TD", dial: "+235" },
  { name: "Comoros", code: "KM", dial: "+269" },
  { name: "Congo (Brazzaville)", code: "CG", dial: "+242" },
  { name: "Congo (Kinshasa)", code: "CD", dial: "+243" },
  { name: "Djibouti", code: "DJ", dial: "+253" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "Equatorial Guinea", code: "GQ", dial: "+240" },
  { name: "Eritrea", code: "ER", dial: "+291" },
  { name: "Eswatini", code: "SZ", dial: "+268" },
  { name: "Ethiopia", code: "ET", dial: "+251" },
  { name: "Gabon", code: "GA", dial: "+241" },
  { name: "Gambia", code: "GM", dial: "+220" },
  { name: "Ghana", code: "GH", dial: "+233" },
  { name: "Guinea", code: "GN", dial: "+224" },
  { name: "Guinea-Bissau", code: "GW", dial: "+245" },
  { name: "Côte d’Ivoire", code: "CI", dial: "+225" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "Lesotho", code: "LS", dial: "+266" },
  { name: "Liberia", code: "LR", dial: "+231" },
  { name: "Libya", code: "LY", dial: "+218" },
  { name: "Madagascar", code: "MG", dial: "+261" },
  { name: "Malawi", code: "MW", dial: "+265" },
  { name: "Mali", code: "ML", dial: "+223" },
  { name: "Mauritania", code: "MR", dial: "+222" },
  { name: "Mauritius", code: "MU", dial: "+230" },
  { name: "Mayotte", code: "YT", dial: "+262" },
  { name: "Morocco", code: "MA", dial: "+212" },
  { name: "Mozambique", code: "MZ", dial: "+258" },
  { name: "Namibia", code: "NA", dial: "+264" },
  { name: "Niger", code: "NE", dial: "+227" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "Reunion", code: "RE", dial: "+262" },
  { name: "Rwanda", code: "RW", dial: "+250" },
  { name: "Sao Tome & Principe", code: "ST", dial: "+239" },
  { name: "Senegal", code: "SN", dial: "+221" },
  { name: "Seychelles", code: "SC", dial: "+248" },
  { name: "Sierra Leone", code: "SL", dial: "+232" },
  { name: "Somalia", code: "SO", dial: "+252" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "South Sudan", code: "SS", dial: "+211" },
  { name: "Sudan", code: "SD", dial: "+249" },
  { name: "Tanzania", code: "TZ", dial: "+255" },
  { name: "Togo", code: "TG", dial: "+228" },
  { name: "Tunisia", code: "TN", dial: "+216" },
  { name: "Uganda", code: "UG", dial: "+256" },
  { name: "Zambia", code: "ZM", dial: "+260" },
  { name: "Zimbabwe", code: "ZW", dial: "+263" },

  { name: "Afghanistan", code: "AF", dial: "+93" },
  { name: "Armenia", code: "AM", dial: "+374" },
  { name: "Azerbaijan", code: "AZ", dial: "+994" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Bhutan", code: "BT", dial: "+975" },
  { name: "Brunei", code: "BN", dial: "+673" },
  { name: "Cambodia", code: "KH", dial: "+855" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "Cyprus", code: "CY", dial: "+357" },
  { name: "Georgia", code: "GE", dial: "+995" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Iran", code: "IR", dial: "+98" },
  { name: "Iraq", code: "IQ", dial: "+964" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kazakhstan", code: "KZ", dial: "+7" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996" },
  { name: "Laos", code: "LA", dial: "+856" },
  { name: "Lebanon", code: "LB", dial: "+961" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Maldives", code: "MV", dial: "+960" },
  { name: "Mongolia", code: "MN", dial: "+976" },
  { name: "Myanmar", code: "MM", dial: "+95" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "North Korea", code: "KP", dial: "+850" },
  { name: "Oman", code: "OM", dial: "+968" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Palestine", code: "PS", dial: "+970" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Syria", code: "SY", dial: "+963" },
  { name: "Taiwan", code: "TW", dial: "+886" },
  { name: "Tajikistan", code: "TJ", dial: "+992" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Timor-Leste", code: "TL", dial: "+670" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "Turkmenistan", code: "TM", dial: "+993" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "Uzbekistan", code: "UZ", dial: "+998" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Yemen", code: "YE", dial: "+967" },
];

COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    country: "",
    countryCode: "+44",
    promoCode: "",
    password: "",
    confirmPassword: "",
  });

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function selectCountry(c) {
    setFormData((prev) => ({
      ...prev,
      countryCode: c.dial,
      country: c.name,
    }));
    setShowDropdown(false);
    setSearch("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!acceptedTerms) {
      return setError("You must accept Terms & Conditions");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const fullPhone = `${formData.countryCode}${formData.phone}`;

      const response = await api.post("/user/register", {
        ...formData,
        phone: fullPhone,
        acceptedTerms: true,
      });

      setSuccess(response.message || "Registration successful");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <Navbar />

      <section className="register-section">
        <div className="container register-layout">
          <div className="register-info">
            <h1>Create Your Account</h1>
            <p>
              Join Rebetas and access powerful AI-driven virtual football
              predictions.
            </p>
          </div>

          <div className="register-card">
            <h2>Register</h2>

            <form className="register-form" onSubmit={handleSubmit}>
              <input
                name="username"
                placeholder="Username"
                onChange={handleChange}
              />
              <input
                name="fullName"
                placeholder="Full Name"
                onChange={handleChange}
              />
              <input
                name="email"
                placeholder="Email Address"
                onChange={handleChange}
              />

              {/* 🔥 PREMIUM PHONE INPUT */}
              <div className="phone-group">
                <div
                  className="country-selector"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <ReactCountryFlag
                    countryCode={
                      COUNTRIES.find((c) => c.dial === formData.countryCode)
                        ?.code
                    }
                    svg
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span>{formData.countryCode}</span>
                </div>

                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />

                {showDropdown && (
                  <div className="country-dropdown">
                    <input
                      placeholder="Search country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="country-list">
                      {filteredCountries.map((c) => (
                        <div
                          key={c.code}
                          className="country-item"
                          onClick={() => selectCountry(c)}
                        >
                          <ReactCountryFlag
                            countryCode={c.code}
                            svg
                            style={{ width: "20px", height: "20px" }}
                          />
                          <span>{c.name}</span>
                          <span>{c.dial}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                name="country"
                placeholder="Country"
                value={formData.country}
                readOnly
              />

              <input
                name="promoCode"
                placeholder="Promo Code"
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

              <div className="password-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div>

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  I agree to <Link to="/terms">Terms</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>

              {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
              {success && <p style={{ color: "#22c55e" }}>{success}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="register-login">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
