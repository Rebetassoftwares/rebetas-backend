import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn, getStoredUser } from "./utils/auth";

/* PUBLIC */
import Landing from "./pages/Landing/Landing";
import About from "./pages/About/About";
import Pricing from "./pages/Pricing/Pricing";
import Tutorials from "./pages/Tutorials/Tutorials";
import FAQ from "./pages/FAQ/FAQ";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import SupportedPlatforms from "./pages/SupportedPlatforms/SupportedPlatforms";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import Terms from "./pages/Register/Terms";
import Privacy from "./pages/Register/Privacy";
import PaymentVerify from "./pages/PaymentVerify/PaymentVerify";

/* USER */
import Dashboard from "./pages/Dashboard/Dashboard";
import Predictions from "./pages/Predictions/Predictions";
import Account from "./pages/Account/Account";
import PromoDashboard from "./pages/PromoDashboard";
import PayoutDetails from "./pages/PayoutDetails";

/* ADMIN */
import AdminLayout from "./layouts/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard/AdminDashboard";
import PricingManagement from "./pages/admin/PricingManagement/PricingManagement";
import PromoCodes from "./pages/admin/PromoCodes/PromoCodes";
import Users from "./pages/admin/Users/Users";
import Payments from "./pages/admin/Payments/Payments";
import Subscriptions from "./pages/admin/Subscriptions/Subscriptions";
import SystemSettings from "./pages/admin/System/SystemSettings";
import PromoDetails from "./pages/admin/PromoDetails/PromoDetails";
import Withdrawals from "./pages/admin/Withdrawals";
import UserDetail from "./pages/admin/UserDetail/UserDetail";

/* 🔥 NEW SCREENS */
import PlatformPage from "./pages/admin/platforms/PlatformPage";
import PredictionSettings from "./pages/admin/predictions/PredictionSettings";
import PlatformLeagues from "./pages/admin/leagues/PlatformLeagues";
import LeagueForm from "./pages/admin/leagues/LeagueForm";
import LeagueDetail from "./pages/admin/leagues/LeagueDetail";
import LeaguePredictions from "./pages/admin/predictions/LeaguePredictions";
import LivePredictions from "./pages/admin/predictions/LivePredictions";

/* ---------------- USER PROTECTED ---------------- */
function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

/* ---------------- ADMIN PROTECTED ---------------- */
function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const user = getStoredUser();

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ---------------- APP ---------------- */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* -------- PUBLIC -------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/payment/verify" element={<PaymentVerify />} />
        <Route path="/supported-platforms" element={<SupportedPlatforms />} />
        <Route path="/promo-dashboard" element={<PromoDashboard />} />
        <Route path="/payout-details" element={<PayoutDetails />} />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* -------- USER -------- */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prediction/:platform"
          element={
            <ProtectedRoute>
              <Predictions />
            </ProtectedRoute>
          }
        />

        {/* -------- ADMIN -------- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* DEFAULT */}
          <Route index element={<AdminDashboard />} />

          {/* EXISTING */}
          <Route path="pricing" element={<PricingManagement />} />
          <Route path="promo-codes" element={<PromoCodes />} />
          <Route path="users" element={<Users />} />
          <Route path="payments" element={<Payments />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="system" element={<SystemSettings />} />
          <Route path="promos/:id" element={<PromoDetails />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="/admin/users/:id" element={<UserDetail />} />

          {/* 🔥 PLATFORM SYSTEM */}
          <Route path="platforms" element={<PlatformPage />} />

          {/* 🔥 PREDICTION SYSTEM ENTRY */}
          <Route path="predictions" element={<PredictionSettings />} />

          {/* 🔥 PLATFORM → LEAGUES */}
          <Route
            path="predictions/:platformId/leagues"
            element={<PlatformLeagues />}
          />

          {/* 🔥 LEAGUE CONFIG */}
          <Route path="leagues/create" element={<LeagueForm />} />
          <Route path="leagues/:leagueId/edit" element={<LeagueForm />} />

          {/* 🔥 LEAGUE DETAIL */}
          <Route path="leagues/:leagueId" element={<LeagueDetail />} />

          {/* 🔥 PREDICTIONS ENGINE */}
          <Route
            path="leagues/:leagueId/predictions"
            element={<LeaguePredictions />}
          />

          {/* 🔥 LIVE MONITOR */}
          <Route path="predictions/live" element={<LivePredictions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
