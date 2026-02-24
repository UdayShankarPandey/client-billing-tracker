import React, { useEffect, useMemo, useState } from "react";
import { expenseAPI, projectAPI } from "../services/api";
import "./ListPage.css";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";

const EXPENSE_CATEGORIES = [
  "software",
  "hardware",
  "labor",
  "utilities",
  "office-supplies",
  "travel",
  "marketing",
  "hosting",
  "subscription",
  "maintenance",
  "other",
];

const EXPENSE_STATUSES = ["pending", "approved", "rejected", "paid"];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const canManage = userHasPermission(PERMISSIONS.MANAGE_EXPENSES, readStoredUser());

  const [formData, setFormData] = useState({
    category: "software",
    description: "",
    amount: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    paymentMethod: "bank-transfer",
    notes: "",
    taxDeductible: false,
    projectId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expenseRes, projRes] = await Promise.all([
        expenseAPI.getAll({}),
        projectAPI.getAll(),
      ]);
      setExpenses(expenseRes.data);
      setProjects(projRes.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.description || !formData.amount) {
      toast.show({ type: "error", title: "Validation Error", message: "Please fill in required fields" });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.show({ type: "error", title: "Invalid Amount", message: "Amount must be greater than 0" });
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        projectId: formData.projectId || undefined,
      };

      if (editingId) {
        await expenseAPI.update(editingId, submitData);
        toast.show({ type: "success", title: "Success", message: "Expense updated successfully" });
      } else {
        await expenseAPI.create(submitData);
        toast.show({ type: "success", title: "Success", message: "Expense created successfully" });
      }

      resetForm();
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: err.response?.data?.message || "Error saving expense" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      vendor: expense.vendor || "",
      date: expense.date.split("T")[0],
      status: expense.status,
      paymentMethod: expense.paymentMethod || "bank-transfer",
      notes: expense.notes || "",
      taxDeductible: expense.taxDeductible || false,
      projectId: expense.projectId?._id || "",
    });
    setEditingId(expense._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await expenseAPI.delete(id);
      toast.show({ type: "success", title: "Success", message: "Expense deleted successfully" });
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: "Error deleting expense" });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await expenseAPI.update(id, { status: newStatus });
      toast.show({ type: "success", title: "Success", message: "Status updated successfully" });
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: "Error updating status" });
    }
  };

  const resetForm = () => {
    setFormData({
      category: "software",
      description: "",
      amount: "",
      vendor: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      paymentMethod: "bank-transfer",
      notes: "",
      taxDeductible: false,
      projectId: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    resetForm();
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    return project?.name || "Unknown";
  };

  const columns = useMemo(
    () => [
      { key: "date", label: "Date", accessor: (row) => new Date(row.date).toLocaleDateString() },
      { key: "description", label: "Description" },
      { key: "category", label: "Category", accessor: (row) => row.category.charAt(0).toUpperCase() + row.category.slice(1).replace("-", " ") },
      { key: "amount", label: "Amount", accessor: (row) => `$${row.amount.toFixed(2)}` },
      { key: "vendor", label: "Vendor" },
      { key: "project", label: "Project", accessor: (row) => getProjectName(row.projectId?._id || row.projectId) },
      {
        key: "status",
        label: "Status",
        accessor: (row) => (
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row._id, e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "12px",
            }}
            disabled={!canManage}
          >
            {EXPENSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        ),
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
    [canManage, expenses, projects]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">💸</span> <span className="page-title-text">Expenses</span></h1>
        {canManage && (
          <button
            className="btn-primary top-action-btn"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? "Cancel" : "+ Add Expenses"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card">
          <form id="expense-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>📝 Description *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What is this expense for?"
                  required
                />
              </div>
              <div className="form-group">
                <label>🏷️ Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>💵 Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>🏢 Vendor</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Vendor or supplier name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>📅 Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>✅ Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  {EXPENSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>💳 Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                  <option value="cash">Cash</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>📱 Project</label>
                <select name="projectId" value={formData.projectId} onChange={handleInputChange}>
                  <option value="">No Project</option>
                  {projects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>📝 Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>
                <input
                  type="checkbox"
                  name="taxDeductible"
                  checked={formData.taxDeductible}
                  onChange={handleInputChange}
                />
                Tax Deductible
              </label>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Expense"}
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
        isEmpty={!loading && expenses.length === 0}
        emptyTitle="No expenses recorded yet"
        emptyDescription="Start tracking your business expenses."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={expenses}
            columns={columns}
            emptyMessage="No expenses found"
            fileName="expenses.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default ExpensesPage;
