import React, { useEffect, useMemo, useState } from "react";
import { invoiceAPI, clientAPI, projectAPI, workLogAPI } from "../services/api";
import "./ListPage.css";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning";
import { invoiceSchema, mapZodErrors } from "../utils/validation";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const canManage = userHasPermission(PERMISSIONS.MANAGE_INVOICES, readStoredUser());
  const toast = useToast();

  // Status transition rules - what statuses can transition to what
  const statusTransitions = {
    draft: ["sent", "draft"],
    sent: ["partially-paid", "paid", "overdue"],
    "partially-paid": ["paid", "overdue"],
    paid: [], // Terminal state - but admins can override
    overdue: ["partially-paid", "paid"],
  };

  const getAvailableStatusTransitions = (currentStatus) => {
    const user = readStoredUser();
    const isAdmin = user?.role === "admin";
    
    // Admins can always transition to any status for manual corrections
    if (isAdmin) {
      return ["draft", "sent", "partially-paid", "paid", "overdue"];
    }
    
    // Regular users follow the strict transitions
    return statusTransitions[currentStatus] || [currentStatus];
  };

  // Determine if invoice can be deleted
  const canDeleteInvoice = (invoice) => {
    return invoice.status === "draft" && !invoice.__optimistic;
  };

  // Determine if invoice can be edited
  const canEditInvoice = (invoice) => {
    return invoice.status === "draft";
  };

  // Get status-specific message and styling
  const getStatusMessage = (invoice) => {
    const now = new Date();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const isOverdue = dueDate && dueDate < now && invoice.dueAmount > 0;

    switch (invoice.status) {
      case "draft":
        return {
          message: "💵 Invoice is in draft mode - edit or delete before sending",
          class: "status-message-info",
        };
      case "sent":
        return {
          message: `📤 Invoice sent - awaiting payment of $${(invoice.dueAmount || 0).toFixed(
            2
          )}`,
          class: "status-message-warning",
        };
      case "partially-paid":
        return {
          message: `💰 Received $${(invoice.amountPaid || 0).toFixed(2)} - Due: $${(
            invoice.dueAmount || 0
          ).toFixed(2)}`,
          class: "status-message-info",
        };
      case "paid":
        return {
          message: "✅ Invoice fully paid and settled",
          class: "status-message-success",
        };
      case "overdue":
        return {
          message: `⚠️ Invoice is OVERDUE - Due: $${(invoice.dueAmount || 0).toFixed(2)}`,
          class: "status-message-danger",
        };
      default:
        return { message: "", class: "" };
    }
  };

  // Get emoji for status
  const getStatusEmoji = (status) => {
    const emojis = {
      draft: "💵",
      sent: "📤",
      "partially-paid": "💰",
      paid: "✅",
      overdue: "⚠️",
    };
    return emojis[status] || "📋";
  };
  const [dirtyToastShown, setDirtyToastShown] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    workLogIds: [],
    taxEnabled: false,
    taxPercentage: 0,
    dueDate: "",
  });
  const isDirty = showForm && (
    formData.clientId ||
    formData.projectId ||
    formData.workLogIds.length > 0 ||
    formData.taxEnabled ||
    formData.taxPercentage > 0 ||
    formData.dueDate
  );
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (isDirty && !dirtyToastShown) {
      toast.show({ type: "info", message: "Unsaved invoice changes", duration: 2500 });
      setDirtyToastShown(true);
    }
    if (!isDirty && dirtyToastShown) {
      setDirtyToastShown(false);
    }
  }, [isDirty, dirtyToastShown, toast]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoiceRes, clientRes, projectRes, logRes] = await Promise.all([
        invoiceAPI.getAll(),
        clientAPI.getAll(),
        projectAPI.getAll(),
        workLogAPI.getAll(),
      ]);
      setInvoices(invoiceRes.data);
      setClients(clientRes.data);
      setProjects(projectRes.data);
      setWorkLogs(logRes.data.filter((log) => log.billable && !log.invoiceId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "taxPercentage"
            ? (value === "" ? "" : Number(value))
            : value,
    }));
  };

  const handleWorkLogToggle = (logId) => {
    setFormData((prev) => ({
      ...prev,
      workLogIds: prev.workLogIds.includes(logId)
        ? prev.workLogIds.filter((id) => id !== logId)
        : [...prev.workLogIds, logId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = invoiceSchema.safeParse(formData);
    if (!validation.success) {
      setFieldErrors(mapZodErrors(validation.error));
      return;
    }

    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticInvoice = {
      _id: tempId,
      invoiceNumber: `Draft-${Date.now()}`,
      clientId: clients.find((c) => c._id === formData.clientId) || { _id: formData.clientId },
      projectId: formData.projectId ? { _id: formData.projectId } : null,
      subtotal: 0,
      tax: 0,
      total: 0,
      amountPaid: 0,
      dueAmount: 0,
      status: "draft",
      issueDate: new Date().toISOString(),
      taxEnabled: formData.taxEnabled,
      taxPercentage: formData.taxEnabled ? Number(formData.taxPercentage || 0) : 0,
      __optimistic: true,
    };
    setInvoices((prev) => [optimisticInvoice, ...prev]);
    try {
      const response = await invoiceAPI.create(formData);
      const created = response.data?.invoice;
      setInvoices((prev) => prev.map((inv) => (inv._id === tempId ? (created || inv) : inv)));
      setFormData({
        clientId: "",
        projectId: "",
        workLogIds: [],
        taxEnabled: false,
        taxPercentage: 0,
        dueDate: "",
      });
      setFieldErrors({});
      setShowForm(false);
      toast.show({ type: "success", message: "Invoice created" });
    } catch (err) {
      setInvoices((prev) => prev.filter((inv) => inv._id !== tempId));
      setError(err.response?.data?.message || "Failed to create invoice");
      toast.show({ type: "error", message: "Rolled back invoice creation" });
    } finally {
      fetchData();
      setSaving(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client?.name || "Unknown";
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    return project?.name || "Unknown";
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await invoiceAPI.downloadPdf(invoiceId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download PDF");
      toast.show({ type: "error", message: "Failed to download PDF" });
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Delete this invoice?")) return;
    const snapshot = [...invoices];
    setInvoices((prev) => prev.filter((inv) => inv._id !== invoiceId));
    try {
      await invoiceAPI.delete(invoiceId);
      toast.show({ type: "success", message: "Invoice deleted" });
    } catch (err) {
      setInvoices(snapshot);
      setError(err.response?.data?.message || "Failed to delete invoice");
      toast.show({ type: "error", message: "Rolled back invoice deletion" });
    } finally {
      fetchData();
    }
  };

  const handleEditInvoice = (invoice) => {
    if (!canEditInvoice(invoice)) {
      toast.show({ type: "error", message: "Only draft invoices can be edited" });
      return;
    }
    setFormData({
      clientId: invoice.clientId?._id || invoice.clientId,
      projectId: invoice.projectId?._id || invoice.projectId || "",
      workLogIds: invoice.workLogs?.map((w) => w._id) || [],
      taxEnabled: invoice.taxPercentage > 0,
      taxPercentage: invoice.taxPercentage || 0,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (invoiceId, status) => {
    const snapshot = [...invoices];
    setInvoices((prev) => prev.map((inv) => (inv._id === invoiceId ? { ...inv, status } : inv)));
    try {
      const response = await invoiceAPI.update(invoiceId, { status });
      const updatedInvoice = response?.data?.invoice;
      if (updatedInvoice) {
        setInvoices((prev) =>
          prev.map((inv) => (inv._id === invoiceId ? { ...inv, ...updatedInvoice } : inv))
        );
      }
      toast.show({ type: "success", message: "Invoice updated" });
    } catch (err) {
      setInvoices(snapshot);
      setError(err.response?.data?.message || "Failed to update invoice");
      toast.show({ type: "error", message: "Rolled back invoice update" });
    }
  };

  const columns = useMemo(
    () => [
      { key: "invoiceNumber", label: "Invoice #", accessor: (row) => row.invoiceNumber },
      { key: "client", label: "Client", accessor: (row) => getClientName(row.clientId?._id || row.clientId) },
      { key: "tax", label: "Tax", accessor: (row) => (row.taxEnabled ? `${row.taxPercentage}%` : "Disabled") },
      { key: "total", label: "Amount", accessor: (row) => `$${Number(row.total || 0).toFixed(2)}` },
      { key: "amountPaid", label: "Paid", accessor: (row) => `$${Number(row.amountPaid || 0).toFixed(2)}` },
      { key: "dueAmount", label: "Due", accessor: (row) => `$${Number(row.dueAmount || 0).toFixed(2)}` },
      {
        key: "status",
        label: "Status",
        accessor: (row) => row.status,
        render: (row) => {
          const availableStatuses = getAvailableStatusTransitions(row.status);
          const emoji = getStatusEmoji(row.status);
          return canManage ? (
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row._id, e.target.value)}
              disabled={row.__optimistic || availableStatuses.length === 0}
              title={availableStatuses.length === 0 ? "No status transitions available" : ""}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {getStatusEmoji(status)} {status}
                </option>
              ))}
            </select>
          ) : (
            <span className={`badge badge-${row.status}`}>
              {emoji} {row.status}
            </span>
          );
        },
      },
      { key: "issueDate", label: "Date", accessor: (row) => new Date(row.issueDate).toLocaleDateString() },
      {
        key: "actions",
        label: "Actions",
        accessor: () => "",
        render: (row) => (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                padding: "8px 12px",
                border: "1px solid rgba(0,255,247,0.3)",
                borderRadius: "6px",
                backgroundColor: "rgba(0,255,247,0.05)",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => handleDownloadPdf(row._id, row.invoiceNumber)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#00fff7", fontWeight: "600" }}
              >
                📄 PDF
              </button>
            </div>
            {canManage && canEditInvoice(row) ? (
              <div
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(0,255,247,0.3)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0,255,247,0.05)",
                }}
              >
                <button
                  onClick={() => handleEditInvoice(row)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#0066cc", fontWeight: "600" }}
                >
                  ✏️ Edit
                </button>
              </div>
            ) : null}
            {canManage && canDeleteInvoice(row) ? (
              <div
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(255,59,106,0.3)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255,59,106,0.05)",
                }}
              >
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteInvoice(row._id)}
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
            ) : null}
          </div>
        ),
      },
    ],
    [canManage, invoices, clients, getAvailableStatusTransitions, canDeleteInvoice, getStatusEmoji]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">📄</span> <span className="page-title-text">Invoices</span></h1>
        {canManage ? (
          <button
            className="btn-primary top-action-btn"
            type={showForm ? "submit" : "button"}
            form={showForm ? "invoice-form" : undefined}
            onClick={!showForm ? () => setShowForm(true) : undefined}
            disabled={saving}
          >
            {showForm ? (saving ? "Saving Invoice..." : "Save Invoice") : "+ Add Invoices"}
          </button>
        ) : null}
      </div>

      {invoices.some((inv) => inv.status === "overdue") && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            borderLeft: "4px solid #dc2626",
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "4px",
            color: "#991b1b",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ⚠️ You have {invoices.filter((inv) => inv.status === "overdue").length} overdue invoice(s) -
          Action required!
        </div>
      )}

      {showForm && canManage && (
        <div className="card">
          <form id="invoice-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Client <span className="required">*</span></label>
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
                <label>Project</label>
                <select name="projectId" value={formData.projectId} onChange={handleInputChange}>
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
                <label>Tax</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    name="taxEnabled"
                    checked={formData.taxEnabled}
                    onChange={handleInputChange}
                  />
                  Enable tax on this invoice
                </label>
                <input
                  type="number"
                  name="taxPercentage"
                  value={formData.taxPercentage}
                  onChange={handleInputChange}
                  disabled={!formData.taxEnabled}
                  min="0"
                  max="100"
                  step="0.01"
                  className={fieldErrors.taxPercentage ? "error" : ""}
                />
                {fieldErrors.taxPercentage ? <div className="form-error">{fieldErrors.taxPercentage}</div> : null}
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group full">
              <label>Work Logs <span className="required">*</span></label>
              {workLogs.length === 0 ? (
                <p className="text-muted">No billable work logs available</p>
              ) : (
                <div className="worklog-picker">
                  {workLogs.map((log) => (
                    <label key={log._id} className="worklog-item">
                      <input
                        type="checkbox"
                        checked={formData.workLogIds.includes(log._id)}
                        onChange={() => handleWorkLogToggle(log._id)}
                      />
                      {new Date(log.date).toLocaleDateString()} - {log.hours}h - $
                      {log.billableAmount.toFixed(2)} ({getClientName(log.clientId._id)})
                    </label>
                  ))}
                </div>
              )}
              {fieldErrors.workLogIds ? <div className="form-error">{fieldErrors.workLogIds}</div> : null}
            </div>

          </form>
        </div>
      )}

      <StateWrapper
        loading={loading}
        error={error}
        onRetry={fetchData}
        isEmpty={!loading && invoices.length === 0}
        emptyTitle="No invoices yet"
        emptyDescription="Create your first invoice to start billing."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={invoices}
            columns={columns}
            emptyMessage="No invoices found"
            fileName="invoices.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default InvoicesPage;
