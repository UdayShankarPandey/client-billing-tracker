import React, { useEffect, useMemo, useState } from "react";
import { workLogAPI, projectAPI, clientAPI } from "../services/api";
import "./ListPage.css";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";

const WorkLogsPage = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const toast = useToast();
  const canManage = userHasPermission(PERMISSIONS.MANAGE_WORK_LOGS, readStoredUser());
  const [formData, setFormData] = useState({
    projectId: "",
    clientId: "",
    date: new Date().toISOString().split("T")[0],
    hours: 1,
    description: "",
    billable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, projRes, clientRes] = await Promise.all([
        workLogAPI.getAll(),
        projectAPI.getAll(),
        clientAPI.getAll(),
      ]);
      setWorkLogs(logsRes.data);
      setProjects(projRes.data);
      setClients(clientRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "hours"
            ? (value === "" ? "" : Number(value))
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await workLogAPI.update(editingId, formData);
        toast.show({ type: "success", title: "Success", message: "Work log updated successfully" });
      } else {
        await workLogAPI.create(formData);
        toast.show({ type: "success", title: "Success", message: "Work log created successfully" });
      }
      setFormData({
        projectId: "",
        clientId: "",
        date: new Date().toISOString().split("T")[0],
        hours: 1,
        description: "",
        billable: true,
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: err.response?.data?.message || "Error saving work log" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this work log?")) return;
    try {
      await workLogAPI.delete(id);
      toast.show({ type: "success", title: "Success", message: "Work log deleted successfully" });
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: "Error deleting work log" });
    }
  };

  const handleEdit = (workLog) => {
    setFormData({
      projectId: workLog.projectId?._id || workLog.projectId,
      clientId: workLog.clientId?._id || workLog.clientId,
      date: workLog.date.split("T")[0],
      hours: workLog.hours,
      description: workLog.description,
      billable: workLog.billable,
    });
    setEditingId(workLog._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      projectId: "",
      clientId: "",
      date: new Date().toISOString().split("T")[0],
      hours: 1,
      description: "",
      billable: true,
    });
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    return project?.name || "Unknown";
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client?.name || "Unknown";
  };

  const columns = useMemo(
    () => [
      { key: "date", label: "Date", accessor: (row) => new Date(row.date).toLocaleDateString() },
      { key: "client", label: "Client", accessor: (row) => getClientName(row.clientId?._id || row.clientId) },
      { key: "project", label: "Project", accessor: (row) => getProjectName(row.projectId?._id || row.projectId) },
      { key: "hours", label: "Hours", accessor: (row) => `${row.hours}h`, csvValue: (row) => row.hours },
      {
        key: "amount",
        label: "Amount",
        accessor: (row) => `$${Number(row.billableAmount || 0).toFixed(2)}`,
        csvValue: (row) => Number(row.billableAmount || 0).toFixed(2),
      },
      { key: "billable", label: "Billable", accessor: (row) => (row.billable ? "Yes" : "No") },
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
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#ff3b6a",
                  fontWeight: "600",
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
    [canManage, clients, projects, workLogs]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">⏱️</span> <span className="page-title-text">Work Logs</span></h1>
        {canManage && (
          <button
            className="btn-primary top-action-btn"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? "Cancel" : "+ Add Work Logs"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card">
          <form id="worklog-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>👥 Client *</label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>🎯 Project *</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>📅 Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>⏱️ Hours *</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0.25"
                  step="0.25"
                  required
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                <input
                  type="checkbox"
                  name="billable"
                  checked={formData.billable}
                  onChange={handleInputChange}
                />
                Billable
              </label>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : (editingId ? "Update Work Log" : "Save Work Log")}
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
        onRetry={fetchData}
        isEmpty={!loading && workLogs.length === 0}
        emptyTitle="No work logs yet"
        emptyDescription="Start tracking work by adding your first work log."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={workLogs}
            columns={columns}
            emptyMessage="No work logs found"
            fileName="work-logs.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default WorkLogsPage;
