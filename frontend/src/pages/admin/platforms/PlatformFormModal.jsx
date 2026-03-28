import { useState } from "react";

export default function PlatformFormModal({ initialData, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: initialData?.name || "",
    country: initialData?.country || "",
    logo: initialData?.logo || "",
    isActive: initialData?.isActive ?? true,
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // 🔥 validation
    if (!form.name.trim()) {
      return setError("Platform name is required");
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("country", form.country.trim());
      formData.append("isActive", form.isActive);

      if (form.logo) {
        formData.append("logo", form.logo);
      }

      await onSubmit(formData);
    } catch (err) {
      console.error(err);
      setError("Failed to save platform");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{initialData ? "Edit Platform" : "Create Platform"}</h3>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* NAME */}
          <input
            name="name"
            placeholder="Platform Name"
            value={form.name}
            onChange={handleChange}
          />

          {/* COUNTRY */}
          <input
            name="country"
            placeholder="Country"
            value={form.country}
            onChange={handleChange}
          />

          {/* LOGO */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                logo: e.target.files[0],
              }))
            }
          />

          {/* ACTIVE */}
          <label className="checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active Platform
          </label>

          {/* ACTIONS */}
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : "Create Platform"}
            </button>

            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
