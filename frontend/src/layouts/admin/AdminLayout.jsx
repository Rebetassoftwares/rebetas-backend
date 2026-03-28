import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* MAIN */}
      <div className="admin-main">
        {/* TOPBAR */}
        <div className="admin-topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <h1>Admin Panel</h1>

          <div className="admin-user">
            <span>Admin</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="admin-content">
          {/* 🔥 SAFETY WRAPPER */}
          <div style={{ minHeight: "300px" }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
