import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

const menu = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", path: "/admin", icon: "📊" },
      { name: "Pricing", path: "/admin/pricing", icon: "💳" },
      { name: "Promo Codes", path: "/admin/promo-codes", icon: "🎟️" },
      { name: "Users", path: "/admin/users", icon: "👥" },
    ],
  },

  {
    title: "AUTOPILOT",
    items: [
      { name: "Dashboard", path: "/admin/autopilot", icon: "🚀" },
      { name: "Packages", path: "/admin/autopilot/packages", icon: "📦" },
      { name: "Accounts", path: "/admin/autopilot/accounts", icon: "👤" },
      {
        name: "Withdrawals",
        path: "/admin/autopilot/withdrawals",
        icon: "🏦",
      },
      {
        name: "Transactions",
        path: "/admin/autopilot/transactions",
        icon: "🧾",
      },
      { name: "Analytics", path: "/admin/autopilot/analytics", icon: "📈" },
      {
        name: "Daily Profit Credit",
        path: "/admin/autopilot/daily-profit-credit",
        icon: "💜",
      },
    ],
  },

  {
    title: "PREDICTION SYSTEM",
    items: [
      { name: "Platforms", path: "/admin/platforms", icon: "🏟️" },
      { name: "Prediction Settings", path: "/admin/predictions", icon: "🧠" },
      { name: "Live Predictions", path: "/admin/predictions/live", icon: "📡" },
    ],
  },

  {
    title: "MANAGEMENT",
    items: [
      { name: "Payments", path: "/admin/payments", icon: "💸" },
      { name: "Subscriptions", path: "/admin/subscriptions", icon: "🧾" },
      { name: "System", path: "/admin/system", icon: "⚙️" },
      {
        name: "Withdrawal Settings",
        path: "/admin/settings/withdrawals",
        icon: "⚙️",
      },
      { name: "Withdrawals", path: "/admin/withdrawals", icon: "🏦" },
    ],
  },

  {
    title: "FINANCE",
    items: [
      {
        name: "Currency Rates",
        path: "/admin/currency-rates",
        icon: "🌍",
      },
    ],
  },
];

export default function AdminSidebar({ open, setOpen }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">R</div>

          <div className="brand">
            <h2>Rebetas</h2>
            <p>Admin Panel</p>
          </div>

          <button className="close-btn" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="sidebar-menu">
          {menu.map((group, i) => (
            <div key={i} className="menu-group">
              <span className="menu-title">{group.title}</span>

              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `menu-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setOpen(false)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <p>Rebetas AI</p>
          <span>Admin Control</span>
        </div>
      </aside>
    </>
  );
}
