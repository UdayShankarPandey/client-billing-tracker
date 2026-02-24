import React, { useEffect, useMemo, useState } from "react";
import { paymentAPI, invoiceAPI, clientAPI } from "../services/api";
import "./ListPage.css";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const toast = useToast();
  const canManage = userHasPermission(PERMISSIONS.RECORD_PAYMENTS, readStoredUser());
  const [formData, setFormData] = useState({
    invoiceId: "",
    clientId: "",
    amount: "",
    paymentMethod: "bank-transfer",
    transactionId: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentRes, invoiceRes, clientRes] = await Promise.all([
        paymentAPI.getAll(),
        invoiceAPI.getAll(),
        clientAPI.getAll(),
      ]);
      setPayments(paymentRes.data);
      setInvoices(invoiceRes.data);
      setClients(clientRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "invoiceId") {
      const selectedInvoice = invoices.find((inv) => inv._id === value);
      setFormData((prev) => ({
        ...prev,
        invoiceId: value,
        clientId: selectedInvoice ? (selectedInvoice.clientId?._id || selectedInvoice.clientId) : prev.clientId,
        amount:
          selectedInvoice && (prev.amount === "" || Number(prev.amount) <= 0)
            ? Number(selectedInvoice.dueAmount || 0)
            : prev.amount,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await paymentAPI.update(editingId, formData);
        toast.show({ type: "success", title: "Success", message: "Payment updated successfully" });
      } else {
        await paymentAPI.create(formData);
        toast.show({ type: "success", title: "Success", message: "Payment recorded successfully" });
      }
      setFormData({
        invoiceId: "",
        clientId: "",
        amount: "",
        paymentMethod: "bank-transfer",
        transactionId: "",
        notes: "",
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: err.response?.data?.message || "Error recording payment" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      invoiceId: payment.invoiceId?._id || payment.invoiceId,
      clientId: payment.clientId?._id || payment.clientId,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod || "bank-transfer",
      transactionId: payment.transactionId || "",
      notes: payment.notes || "",
    });
    setEditingId(payment._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    try {
      await paymentAPI.delete(id);
      toast.show({ type: "success", title: "Success", message: "Payment deleted successfully" });
      fetchData();
    } catch (err) {
      toast.show({ type: "error", title: "Error", message: "Error deleting payment" });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      invoiceId: "",
      clientId: "",
      amount: "",
      paymentMethod: "bank-transfer",
      transactionId: "",
      notes: "",
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client?.name || "Unknown";
  };

  const getInvoiceNumber = (invoiceId) => {
    const invoice = invoices.find((i) => i._id === invoiceId);
    return invoice?.invoiceNumber || "Unknown";
  };

  const columns = useMemo(
    () => [
      { key: "paymentDate", label: "Date", accessor: (row) => new Date(row.paymentDate).toLocaleDateString() },
      { key: "client", label: "Client", accessor: (row) => getClientName(row.clientId?._id || row.clientId) },
      { key: "invoice", label: "Invoice", accessor: (row) => getInvoiceNumber(row.invoiceId?._id || row.invoiceId) },
      { key: "amount", label: "Amount", accessor: (row) => `$${Number(row.amount || 0).toFixed(2)}` },
      { key: "paymentMethod", label: "Method", accessor: (row) => row.paymentMethod },
      { key: "status", label: "Status", accessor: (row) => row.status },
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
    [payments, clients, invoices, canManage]
  );

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">💳</span> <span className="page-title-text">Payments</span></h1>
        {canManage && (
          <button
            className="btn-primary top-action-btn"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? "Cancel" : "+ Add Payments"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card">
          <form id="payment-form" onSubmit={handleSubmit}>
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
                <label>📄 Invoice *</label>
                <select
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an invoice</option>
                  {invoices
                    .filter((inv) => Number(inv.dueAmount || 0) > 0)
                    .map((invoice) => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber} - ${Number(invoice.dueAmount || 0).toFixed(2)} due
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
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>💳 Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : (editingId ? "Update Payment" : "Save Payment")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelForm}
                disabled={saving}
              >
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
        isEmpty={!loading && payments.length === 0}
        emptyTitle="No payments recorded yet"
        emptyDescription="Record your first payment to track collections."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
      >
        <div className="card">
          <DataTable
            rows={payments}
            columns={columns}
            emptyMessage="No payments found"
            fileName="payments.csv"
          />
        </div>
      </StateWrapper>
    </div>
  );
};

export default PaymentsPage;
