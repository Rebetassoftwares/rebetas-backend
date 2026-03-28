import { useEffect, useState } from "react";
import {
  getUsers,
  deleteUser,
  resetUserDevice,
  updateUserStatus,
} from "../../../services/adminApi";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [alphabet, setAlphabet] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    show: false,
    action: null,
    userId: null,
    payload: null,
  });

  /* ---------------- LOAD USERS ---------------- */

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const res = await getUsers();
      const data = Array.isArray(res) ? res : res?.data || [];

      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */

  useEffect(() => {
    let result = [...users];

    // Search
    if (search) {
      result = result.filter((u) =>
        `${u.email} ${u.username} ${u.fullName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }

    // Country
    if (countryFilter) {
      result = result.filter((u) => u.country === countryFilter);
    }

    // Role
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Status
    if (statusFilter) {
      result = result.filter((u) => u.accountStatus === statusFilter);
    }

    // Alphabet
    if (alphabet) {
      result = result.filter((u) =>
        u.fullName?.toLowerCase().startsWith(alphabet.toLowerCase()),
      );
    }

    // Date (today, 7days, 30days)
    if (dateFilter) {
      const now = new Date();
      result = result.filter((u) => {
        const created = new Date(u.createdAt);
        const diff = (now - created) / (1000 * 60 * 60 * 24);

        if (dateFilter === "today") return diff < 1;
        if (dateFilter === "7") return diff <= 7;
        if (dateFilter === "30") return diff <= 30;

        return true;
      });
    }

    setFiltered(result);
  }, [
    users,
    search,
    countryFilter,
    roleFilter,
    statusFilter,
    alphabet,
    dateFilter,
  ]);

  /* ---------------- MODAL HANDLER ---------------- */

  function confirmAction(action, userId, payload = null) {
    setModal({ show: true, action, userId, payload });
  }

  async function handleConfirm() {
    try {
      const { action, userId, payload } = modal;

      if (action === "delete") await deleteUser(userId);
      if (action === "reset") await resetUserDevice(userId);
      if (action === "status") await updateUserStatus(userId, payload);

      setModal({ show: false });
      loadUsers();
    } catch (err) {
      console.error(err);
      setError("Action failed");
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="users-page">
      <h2>Users Management</h2>

      {/* SEARCH */}
      <input
        className="search-input"
        placeholder="Search name, email, username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FILTERS */}
      <div className="filters">
        <select onChange={(e) => setCountryFilter(e.target.value)}>
          <option value="">All Countries</option>
          {[...new Set(users.map((u) => u.country))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <select onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>

        <select onChange={(e) => setDateFilter(e.target.value)}>
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      {/* ALPHABET FILTER */}
      <div className="alphabet-filter">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
          <button key={l} onClick={() => setAlphabet(l)}>
            {l}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div className="users-table">
          <div className="table-head">
            <span>User</span>
            <span>Contact</span>
            <span>Country</span>
            <span>Subscription</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filtered.map((user) => (
            <div key={user._id} className="table-row">
              <span>
                <strong>{user.fullName}</strong>
                <br />@{user.username}
              </span>

              <span>
                {user.email}
                <br />
                {user.phone}
              </span>

              <span>{user.country}</span>

              <span>
                {user.subscription ? (
                  <>
                    {user.subscription.plan}
                    <br />
                    {user.subscription.status}
                    <br />
                    {new Date(user.subscription.endDate).toLocaleDateString()}
                  </>
                ) : (
                  "No Subscription"
                )}
              </span>

              {/* STATUS BADGE */}
              <span className={`badge ${user.accountStatus}`}>
                {user.accountStatus}
              </span>

              <div className="actions">
                <button
                  onClick={() => confirmAction("status", user._id, "active")}
                >
                  Activate
                </button>
                <button
                  onClick={() => confirmAction("status", user._id, "suspended")}
                >
                  Suspend
                </button>
                <button
                  onClick={() => confirmAction("status", user._id, "banned")}
                >
                  Ban
                </button>
                <button onClick={() => confirmAction("reset", user._id)}>
                  Reset
                </button>
                <button onClick={() => confirmAction("delete", user._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal.show && (
        <div className="modal">
          <div className="modal-content">
            <p>Are you sure you want to proceed?</p>
            <button onClick={handleConfirm}>Yes</button>
            <button onClick={() => setModal({ show: false })}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
