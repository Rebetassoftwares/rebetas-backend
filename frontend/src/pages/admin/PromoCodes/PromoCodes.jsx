import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getUsers,
} from "../../../services/adminApi";
import "./PromoCodes.css";

export default function PromoCodes() {
  const navigate = useNavigate();

  /* ---------------- USERS ---------------- */
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  /* ---------------- PROMOS ---------------- */
  const [promos, setPromos] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    code: "",
    ownerId: "",
    ownerName: "",
    commissionPercent: "",

    // 🔥 NEW
    discountPercent: "",
    freeDaysWeekly: "",
    freeDaysMonthly: "",
    freeDaysYearly: "",
    maxUsesPerUser: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    show: false,
    id: null,
  });

  /* ---------------- LOAD DATA ---------------- */

  async function loadPromos() {
    try {
      setLoading(true);
      setError("");

      const res = await getPromoCodes();
      const data = Array.isArray(res) ? res : res?.data || [];

      setPromos(data);
      setFiltered(data);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await getUsers();
      const data = Array.isArray(res) ? res : res?.data || [];
      setUsers(data);
    } catch (err) {
      console.error("Users load error:", err);
    }
  }

  useEffect(() => {
    loadPromos();
    loadUsers();
  }, []);

  /* ---------------- FILTER ---------------- */

  useEffect(() => {
    let result = [...promos];

    if (search) {
      result = result.filter((p) =>
        `${p.code} ${p.ownerName}`.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === "active";
      result = result.filter((p) => p.active === isActive);
    }

    setFiltered(result);
  }, [search, statusFilter, promos]);

  /* ---------------- FORM ---------------- */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (!form.ownerId && !editingId) {
        return setError("Please select a user");
      }

      if (editingId) {
        await updatePromoCode(editingId, {
          ownerName: form.ownerName,
          commissionPercent: form.commissionPercent,

          // 🔥 NEW
          discountPercent: Number(form.discountPercent || 0),
          // ✅ CORRECT STRUCTURE
          freeDaysWeekly: Number(form.freeDaysWeekly || 0),
          freeDaysMonthly: Number(form.freeDaysMonthly || 0),
          freeDaysYearly: Number(form.freeDaysYearly || 0),
          maxUsesPerUser: Number(form.maxUsesPerUser || 1),
        });
      } else {
        await createPromoCode({
          code: form.code,
          ownerId: form.ownerId,
          ownerName: form.ownerName,
          commissionPercent: form.commissionPercent,

          // 🔥 NEW
          discountPercent: Number(form.discountPercent || 0),
          freeDaysWeekly: Number(form.freeDaysWeekly || 0),
          freeDaysMonthly: Number(form.freeDaysMonthly || 0),
          freeDaysYearly: Number(form.freeDaysYearly || 0),
          maxUsesPerUser: Number(form.maxUsesPerUser || 1),
        });
      }

      setForm({
        code: "",
        ownerId: "",
        ownerName: "",
        commissionPercent: "",

        discountPercent: "",
        freeDaysWeekly: "",
        freeDaysMonthly: "",
        freeDaysYearly: "",
        maxUsesPerUser: "",
      });

      setUserSearch("");
      setEditingId(null);
      loadPromos();
    } catch (err) {
      console.error(err);
      setError("Action failed");
    }
  }

  /* ---------------- EDIT ---------------- */

  function handleEdit(item) {
    setForm({
      code: item.code,
      ownerId: "",
      ownerName: item.ownerName,
      commissionPercent: item.commissionPercent,

      // 🔥 NEW
      discountPercent: item.discountPercent || "",
      freeDaysWeekly: item.freeDaysByPlan?.weekly || "",
      freeDaysMonthly: item.freeDaysByPlan?.monthly || "",
      freeDaysYearly: item.freeDaysByPlan?.yearly || "",
      maxUsesPerUser: item.maxUsesPerUser || 1,
    });

    setUserSearch(item.ownerName);
    setEditingId(item._id);
  }

  /* ---------------- DELETE ---------------- */

  function confirmDelete(id) {
    setModal({ show: true, id });
  }

  async function handleDelete() {
    try {
      await deletePromoCode(modal.id);
      setModal({ show: false, id: null });
      loadPromos();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  }

  /* ---------------- TOGGLE ---------------- */

  async function toggleActive(item) {
    try {
      await updatePromoCode(item._id, {
        active: !item.active,
      });
      loadPromos();
    } catch (err) {
      console.error(err);
      setError("Update failed");
    }
  }

  /* ---------------- SUMMARY (MULTI-CURRENCY SAFE) ---------------- */

  const totalWallets = promos.reduce((acc, promo) => {
    (promo.wallets || []).forEach((w) => {
      if (!acc[w.currency]) acc[w.currency] = 0;
      acc[w.currency] += w.balance || 0;
    });
    return acc;
  }, {});

  /* ---------------- UI ---------------- */

  return (
    <div className="promo-page">
      <div className="promo-header">
        <h2>Promo Codes</h2>

        <button
          className="withdrawals-btn"
          onClick={() => navigate("/admin/withdrawals")}
        >
          View Withdrawals
        </button>
      </div>

      {/* SUMMARY */}
      <div className="promo-summary">
        <div>Total Codes: {promos.length}</div>

        <div className="multi-currency-summary">
          {Object.keys(totalWallets).length === 0 ? (
            <span>No earnings yet</span>
          ) : (
            Object.entries(totalWallets).map(([currency, amount]) => (
              <div key={currency}>
                {currency}: {amount.toLocaleString()}
              </div>
            ))
          )}
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="promo-controls">
        <input
          placeholder="Search code or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* FORM */}
      <form className="promo-form" onSubmit={handleSubmit}>
        {!editingId && (
          <input
            name="code"
            placeholder="Promo Code"
            value={form.code}
            onChange={handleChange}
            required
          />
        )}

        {/* USER SELECT */}
        <div className="user-select">
          <input
            placeholder="Search user..."
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setShowUserDropdown(true);
            }}
            onFocus={() => setShowUserDropdown(true)}
            required
          />

          {showUserDropdown && (
            <div className="user-dropdown">
              {users
                .filter((u) =>
                  `${u.fullName} ${u.email}`
                    .toLowerCase()
                    .includes(userSearch.toLowerCase()),
                )
                .slice(0, 6)
                .map((user) => (
                  <div
                    key={user._id}
                    className="user-option"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        ownerId: user._id,
                        ownerName: user.fullName,
                      }));
                      setUserSearch(user.fullName);
                      setShowUserDropdown(false);
                    }}
                  >
                    {user.fullName} ({user.email})
                  </div>
                ))}
            </div>
          )}
        </div>

        <input
          name="commissionPercent"
          type="number"
          placeholder="Commission %"
          value={form.commissionPercent}
          onChange={handleChange}
          required
        />

        <input
          name="discountPercent"
          type="number"
          placeholder="Discount % (optional)"
          value={form.discountPercent}
          onChange={handleChange}
        />

        <input
          name="freeDaysWeekly"
          type="number"
          placeholder="Weekly Extra Days"
          value={form.freeDaysWeekly}
          onChange={handleChange}
        />

        <input
          name="freeDaysMonthly"
          type="number"
          placeholder="Monthly Extra Days"
          value={form.freeDaysMonthly}
          onChange={handleChange}
        />

        <input
          name="freeDaysYearly"
          type="number"
          placeholder="Yearly Extra Days"
          value={form.freeDaysYearly}
          onChange={handleChange}
        />

        <input
          name="maxUsesPerUser"
          type="number"
          placeholder="Max Uses Per User"
          value={form.maxUsesPerUser}
          onChange={handleChange}
        />

        <button type="submit">
          {editingId ? "Update Promo" : "Create Promo"}
        </button>
      </form>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No promo codes found</p>
      ) : (
        <div className="promo-grid">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="promo-card"
              onClick={() => navigate(`/admin/promos/${item._id}`)}
            >
              <h3>{item.code}</h3>

              <p>Owner: {item.ownerName}</p>
              <p>Commission: {item.commissionPercent}%</p>
              {item.discountPercent > 0 && (
                <p>Discount: {item.discountPercent}%</p>
              )}

              {item.freeDaysByPlan && (
                <p>
                  Free Time:
                  {item.freeDaysByPlan.weekly || 0}d (W) /
                  {item.freeDaysByPlan.monthly || 0}d (M) /
                  {item.freeDaysByPlan.yearly || 0}d (Y)
                </p>
              )}

              <p>Usage Limit: {item.maxUsesPerUser || 1}</p>
              <p>Status: {item.active ? "Active" : "Inactive"}</p>

              {/* 🔥 WALLET DISPLAY */}
              <div className="wallets">
                {item.wallets && item.wallets.length > 0 ? (
                  item.wallets.map((w) => (
                    <p key={w.currency}>
                      {w.currency}: {w.balance.toLocaleString()}
                    </p>
                  ))
                ) : (
                  <p>No earnings yet</p>
                )}
              </div>

              <div className="actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleEdit(item)}>Edit</button>

                <button onClick={() => toggleActive(item)}>
                  {item.active ? "Deactivate" : "Activate"}
                </button>

                <button onClick={() => confirmDelete(item._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {modal.show && (
        <div className="modal">
          <div className="modal-content">
            <p>Delete this promo code?</p>
            <button onClick={handleDelete}>Yes</button>
            <button onClick={() => setModal({ show: false })}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
