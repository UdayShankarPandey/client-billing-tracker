import React, { useEffect, useMemo, useState } from "react";
import { projectAPI, clientAPI } from "../services/api";
import "./ListPage.css";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning";
import { mapZodErrors, projectSchema } from "../utils/validation";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const canManage = userHasPermission(PERMISSIONS.MANAGE_PROJECTS, readStoredUser());
  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    description: "",
    hourlyRate: 50,
    budget: 0,
    status: "active",
  });
  const isDirty = showForm && Object.entries(formData).some(([key, value]) => key !== "status" && String(value).trim() !== "");
  useUnsavedChangesWarning(isDirty);
  const toast = useToast();

  useEffect(() => {
    fetchProjectsAndClients();
  }, []);

  const fetchProjectsAndClients = async () => {
    try {
      const [projectRes, clientRes] = await Promise.all([
        projectAPI.getAll(),
        clientAPI.getAll(),
      ]);
      setProjects(projectRes.data);
      setClients(clientRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "hourlyRate" || name === "budget" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = projectSchema.safeParse(formData);
    if (!validation.success) {
      setFieldErrors(mapZodErrors(validation.error));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await projectAPI.update(editingId, formData);
        toast.show({ type: "success", message: "Project updated successfully" });
      } else {
        await projectAPI.create(formData);
        toast.show({ type: "success", message: "Project created successfully" });
      }
      setFormData({
        clientId: "",
        name: "",
        description: "",
        hourlyRate: 50,
        budget: 0,
        status: "active",
      });
      setFieldErrors({});
      setShowForm(false);
      setEditingId(null);
      fetchProjectsAndClients();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save project";
      setError(msg);
      toast.show({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const snapshot = [...projects];
    setProjects((prev) => prev.filter((p) => p._id !== id));
    try {
      await projectAPI.delete(id);
      toast.show({ type: "success", message: "Project deleted successfully" });
    } catch (err) {
      setProjects(snapshot);
      const msg = err.response?.data?.message || "Failed to delete project";
      setError(msg);
      toast.show({ type: "error", message: msg });
    } finally {
      fetchProjectsAndClients();
    }
  };

  const handleEdit = (project) => {
    setFormData({
      clientId: project.clientId?._id || project.clientId,
      name: project.name,
      description: project.description || "",
      hourlyRate: project.hourlyRate,
      budget: project.budget || 0,
      status: project.status || "active",
    });
    setEditingId(project._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      clientId: "",
      name: "",
      description: "",
      hourlyRate: 50,
      budget: 0,
      status: "active",
    });
    setFieldErrors({});
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client?.name || "Unknown";
  };

  const columns = useMemo(
    () => [
      { key: "name", label: "Name", accessor: (row) => row.name },
      { key: "client", label: "Client", accessor: (row) => getClientName(row.clientId?._id || row.clientId) },
      { key: "hourlyRate", label: "Rate", accessor: (row) => `$${row.hourlyRate}` },
      { key: "status", label: "Status", accessor: (row) => row.status },
      { key: "totalHours", label: "Hours", accessor: (row) => row.totalHours || 0 },
      {
        key: "totalEarnings",
        label: "Earnings",
        accessor: (row) => `$${Number(row.totalEarnings || 0).toFixed(2)}`,
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
                className="btn-danger"
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
    [canManage, clients, projects]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">🎯</span> <span className="page-title-text">Projects</span></h1>
        {canManage && (
          <button
            className="btn-primary top-action-btn"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? "Cancel" : "+ Add Projects"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card">
          <form id="project-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>👥 Client <span className="required">*</span></label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className={fieldErrors.clientId ? "error" : ""}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.clientId ? <div className="form-error">{fieldErrors.clientId}</div> : null}
              </div>
              <div className="form-group">
                <label>📌 Project Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldErrors.name ? "error" : ""}
                />
                {fieldErrors.name ? <div className="form-error">{fieldErrors.name}</div> : null}
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>🗒️ Hourly Rate</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  step="5"
                  className={fieldErrors.hourlyRate ? "error" : ""}
                />
                {fieldErrors.hourlyRate ? <div className="form-error">{fieldErrors.hourlyRate}</div> : null}
              </div>
              <div className="form-group">
                <label>💵 Budget</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className={fieldErrors.budget ? "error" : ""}
                />
                {fieldErrors.budget ? <div className="form-error">{fieldErrors.budget}</div> : null}
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : (editingId ? "Update Project" : "Save Project")}
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
        onRetry={fetchProjectsAndClients}
        isEmpty={!loading && projects.length === 0}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to organize work logs and invoices."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={projects}
            columns={columns}
            emptyMessage="No projects found"
            fileName="projects.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default ProjectsPage;
