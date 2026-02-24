import React, { useEffect, useMemo, useState } from "react";
import { clientAPI } from "../services/api";
import "./ListPage.css";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { useToast } from "../components/ui/Toast";
import StateWrapper from "../components/ui/StateWrapper";
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning";
import { clientSchema, mapZodErrors } from "../utils/validation";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const canManage = userHasPermission(PERMISSIONS.MANAGE_CLIENTS, readStoredUser());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    billingRate: 50,
    address: "",
  });
  const isDirty = Object.values(formData).some((value) => String(value).trim() !== "") && showForm;
  useUnsavedChangesWarning(isDirty);
  const toast = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll();
      setClients(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [name]: name === "billingRate" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = clientSchema.safeParse(formData);
    if (!validation.success) {
      setFieldErrors(mapZodErrors(validation.error));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await clientAPI.update(editingId, formData);
        toast.show({ type: "success", message: "Client updated successfully" });
      } else {
        const response = await clientAPI.create(formData);
        toast.show({ type: "success", message: "Client created successfully" });
      }
      setFormData({ name: "", email: "", company: "", phone: "", billingRate: 50, address: "" });
      setFieldErrors({});
      setShowForm(false);
      setEditingId(null);
      fetchClients();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save client";
      setError(msg);
      toast.show({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    const snapshot = [...clients];
    setClients((prev) => prev.filter((c) => c._id !== id));
    try {
      await clientAPI.delete(id);
      toast.show({ type: "success", message: "Client deleted successfully" });
    } catch (err) {
      setClients(snapshot);
      const msg = err.response?.data?.message || "Failed to delete client";
      setError(msg);
      toast.show({ type: "error", message: msg });
    } finally {
      fetchClients();
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || "",
      phone: client.phone || "",
      billingRate: client.billingRate,
      address: client.address || "",
    });
    setEditingId(client._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", company: "", phone: "", billingRate: 50, address: "" });
    setFieldErrors({});
  };

  useEffect(() => {
    if (error) toast.show({ type: "error", message: error });
  }, [error, toast]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Name", accessor: (row) => row.name },
      { key: "email", label: "Email", accessor: (row) => row.email },
      { key: "company", label: "Company", accessor: (row) => row.company || "-" },
      { key: "billingRate", label: "Rate", accessor: (row) => `$${row.billingRate}` },
      {
        key: "outstandingBalance",
        label: "Outstanding",
        accessor: (row) => `$${Number(row.outstandingBalance || 0).toFixed(2)}`,
      },
      {
        key: "actions",
        label: "Actions",
        accessor: () => "",
        render: (row) =>
          canManage ? (
            <div
              style={{
                padding: "8px 12px",
                border: "1px solid rgba(255,59,106,0.3)",
                borderRadius: "6px",
                backgroundColor: "rgba(255,59,106,0.05)",
              }}
            >
              <button
                onClick={() => handleEdit(row)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#0066cc",
                  fontWeight: "600",
                  marginRight: "12px",
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(row._id)}
                disabled={row.__optimistic}
                style={{
                  border: "none",
                  background: "none",
                  cursor: row.__optimistic ? "not-allowed" : "pointer",
                  color: "#ff3b6a",
                  fontWeight: "600",
                  opacity: row.__optimistic ? 0.5 : 1,
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ) : (
            <span className="text-muted">View only</span>
          ),
      },
    ],
    [canManage, clients]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">👥</span> <span className="page-title-text">Clients</span></h1>
        {canManage && (
          <button
            className="btn-primary top-action-btn"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? "Cancel" : "+ Add Clients"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card">
          <form id="client-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>👤 Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldErrors.name ? "error" : ""}
                />
                {fieldErrors.name ? <div className="form-error">{fieldErrors.name}</div> : null}
              </div>
              <div className="form-group">
                <label>📧 Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={fieldErrors.email ? "error" : ""}
                />
                {fieldErrors.email ? <div className="form-error">{fieldErrors.email}</div> : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>🏢 Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>📞 Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Billing Rate</label>
                <input
                  type="number"
                  name="billingRate"
                  value={formData.billingRate}
                  onChange={handleInputChange}
                  min="0"
                  step="5"
                  className={fieldErrors.billingRate ? "error" : ""}
                />
                {fieldErrors.billingRate ? <div className="form-error">{fieldErrors.billingRate}</div> : null}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : (editingId ? "Update Client" : "Save Client")}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancelForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <StateWrapper
        loading={loading}
        error={error}
        onRetry={fetchClients}
        isEmpty={!loading && clients.length === 0}
        emptyTitle="No clients yet"
        emptyDescription="Create your first client to start billing."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={clients}
            columns={columns}
            emptyMessage="No clients found"
            fileName="clients.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default ClientsPage;
