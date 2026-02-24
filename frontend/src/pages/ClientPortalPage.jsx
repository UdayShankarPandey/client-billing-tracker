import React, { useCallback, useEffect, useMemo, useState } from "react";
import { invoiceAPI, projectAPI, workLogAPI, expenseAPI, paymentAPI } from "../services/api";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";
import { readStoredUser } from "../utils/rbac";
import portalLogo from "../assets/client-portal-logo.png";
import "./ListPage.css";

const ClientPortalPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("projects");
  const toast = useToast();
  const currentUser = readStoredUser();

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  const fetchData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      
      // Backend will automatically filter data by client's assigned clientId
      const [invoicesRes, projectsRes, workLogsRes, expenseRes, paymentRes] = await Promise.all([
        invoiceAPI.getAll(),
        projectAPI.getAll(),
        workLogAPI.getAll(),
        expenseAPI.getAll({}),
        paymentAPI.getAll(),
      ]);
      
      setInvoices(invoicesRes.data || []);
      setProjects(projectsRes.data || []);
      setWorkLogs(workLogsRes.data || []);
      setExpenses(expenseRes.data || []);
      setPayments(paymentRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


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
      toast.show({ type: "error", message: "Unable to download PDF" });
    }
  };

  const invoiceColumns = useMemo(
    () => [
      { key: "invoiceNumber", label: "Invoice #", accessor: (row) => row.invoiceNumber },
      { key: "issueDate", label: "Date", accessor: (row) => new Date(row.issueDate).toLocaleDateString() },
      { key: "total", label: "Total", accessor: (row) => `$${Number(row.total || 0).toFixed(2)}` },
      { key: "amountPaid", label: "Paid", accessor: (row) => `$${Number(row.amountPaid || 0).toFixed(2)}` },
      { key: "dueAmount", label: "Due", accessor: (row) => `$${Number(row.dueAmount || 0).toFixed(2)}` },
      { key: "status", label: "Payment Status", accessor: (row) => row.status },
      {
        key: "actions",
        label: "Actions",
        accessor: () => "",
        render: (row) => (
          <button className="btn-secondary" onClick={() => handleDownloadPdf(row._id, row.invoiceNumber)}>
            Download PDF
          </button>
        ),
      },
    ],
    []
  );

  const projectColumns = useMemo(
    () => [
      { key: "name", label: "Name", accessor: (row) => row.name },
      { key: "description", label: "Description", accessor: (row) => row.description || "-" },
      { key: "status", label: "Status", accessor: (row) => row.status },
      { key: "hourlyRate", label: "Rate", accessor: (row) => `$${row.hourlyRate}` },
      {
        key: "totalEarnings",
        label: "Earnings",
        accessor: (row) => `$${Number(row.totalEarnings || 0).toFixed(2)}`,
      },
    ],
    []
  );

  const workLogColumns = useMemo(
    () => [
      { key: "date", label: "Date", accessor: (row) => new Date(row.date).toLocaleDateString() },
      { key: "project", label: "Project", accessor: (row) => {
        const projectName = row.projectId?.name || row.projectName || "Unknown";
        return projectName;
      }},
      { key: "description", label: "Description", accessor: (row) => row.description },
      { key: "hours", label: "Hours", accessor: (row) => `${row.hours}h` },
      { key: "billable", label: "Billable", accessor: (row) => row.billable ? "Yes" : "No" },
      { key: "amount", label: "Amount", accessor: (row) => `$${Number(row.billableAmount || 0).toFixed(2)}` },
    ],
    []
  );

  const expenseColumns = useMemo(
    () => [
      { key: "date", label: "Date", accessor: (row) => new Date(row.date).toLocaleDateString() },
      { key: "description", label: "Description" },
      { key: "category", label: "Category", accessor: (row) => row.category.charAt(0).toUpperCase() + row.category.slice(1).replace("-", " ") },
      { key: "amount", label: "Amount", accessor: (row) => `$${row.amount.toFixed(2)}` },
      { key: "vendor", label: "Vendor" },
      { key: "project", label: "Project", accessor: (row) => {
        const projectName = row.projectId?.name || row.projectName || "Unknown";
        return projectName;
      }},
      { key: "status", label: "Status", accessor: (row) => row.status },
    ],
    []
  );

  const paymentColumns = useMemo(
    () => [
      { key: "paymentDate", label: "Date", accessor: (row) => new Date(row.paymentDate).toLocaleDateString() },
      { key: "invoice", label: "Invoice", accessor: (row) => {
        const invoiceNumber = row.invoiceId?.invoiceNumber || row.invoiceNumber || "Unknown";
        return invoiceNumber;
      }},
      { key: "amount", label: "Amount", accessor: (row) => `$${Number(row.amount || 0).toFixed(2)}` },
      { key: "paymentMethod", label: "Method", accessor: (row) => row.paymentMethod },
      { key: "status", label: "Status", accessor: (row) => row.status },
    ],
    []
  );

  const getTabContent = () => {
    return (
      <div>
        {activeTab === "projects" && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#059669", fontSize: "18px", fontWeight: "600" }}>🎯 Projects</h2>
            <StateWrapper
              loading={loading}
              error={error}
              onRetry={fetchData}
              isEmpty={!loading && projects.length === 0}
              emptyTitle="No projects available"
              emptyDescription="Your projects will appear here."
              loadingContent={
                <div className="card">
                  <SkeletonLoader lines={6} />
                </div>
              }
            >
              <div className="card">
                <DataTable rows={projects} columns={projectColumns} emptyMessage="No projects found" fileName="client-projects.csv" />
              </div>
            </StateWrapper>
          </div>
        )}

        {activeTab === "workLogs" && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#d97706", fontSize: "18px", fontWeight: "600" }}>⏱️ Work Logs</h2>
            <StateWrapper
              loading={loading}
              error={error}
              onRetry={fetchData}
              isEmpty={!loading && workLogs.length === 0}
              emptyTitle="No work logs available"
              emptyDescription="Work logs will appear here."
              loadingContent={
                <div className="card">
                  <SkeletonLoader lines={6} />
                </div>
              }
            >
              <div className="card">
                <DataTable rows={workLogs} columns={workLogColumns} emptyMessage="No work logs found" fileName="client-worklogs.csv" />
              </div>
            </StateWrapper>
          </div>
        )}

        {activeTab === "invoices" && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#2563eb", fontSize: "18px", fontWeight: "600" }}>📄 Invoices</h2>
            <StateWrapper
              loading={loading}
              error={error}
              onRetry={fetchData}
              isEmpty={!loading && invoices.length === 0}
              emptyTitle="No invoices available"
              emptyDescription="Your invoices will appear here."
              loadingContent={
                <div className="card">
                  <SkeletonLoader lines={6} />
                </div>
              }
            >
              <div className="card">
                <DataTable rows={invoices} columns={invoiceColumns} emptyMessage="No invoices found" fileName="client-invoices.csv" />
              </div>
            </StateWrapper>
          </div>
        )}

        {activeTab === "expenses" && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#dc2626", fontSize: "18px", fontWeight: "600" }}>💰 Expenses</h2>
            <StateWrapper
              loading={loading}
              error={error}
              onRetry={fetchData}
              isEmpty={!loading && expenses.length === 0}
              emptyTitle="No expenses available"
              emptyDescription="Expenses will appear here."
              loadingContent={
                <div className="card">
                  <SkeletonLoader lines={6} />
                </div>
              }
            >
              <div className="card">
                <DataTable rows={expenses} columns={expenseColumns} emptyMessage="No expenses found" fileName="client-expenses.csv" />
              </div>
            </StateWrapper>
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#7c3aed", fontSize: "18px", fontWeight: "600" }}>💳 Payments</h2>
            <StateWrapper
              loading={loading}
              error={error}
              onRetry={fetchData}
              isEmpty={!loading && payments.length === 0}
              emptyTitle="No payments available"
              emptyDescription="Payment records will appear here."
              loadingContent={
                <div className="card">
                  <SkeletonLoader lines={6} />
                </div>
              }
            >
              <div className="card">
                <DataTable rows={payments} columns={paymentColumns} emptyMessage="No payments found" fileName="client-payments.csv" />
              </div>
            </StateWrapper>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="list-page">
      <div className="page-header" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        padding: "0",
        marginBottom: "30px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          padding: "24px 32px"
        }}>
          <img src={portalLogo} alt="Client Portal" style={{
            height: "60px",
            width: "auto",
            filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))"
          }} />
          <div>
            <h1 style={{
              margin: "0",
              fontSize: "32px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "-0.5px",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
            }}>Client Portal</h1>
            <p style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: "500"
            }}>Manage your projects, invoices & more</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "30px", padding: "24px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "0"
        }}>
          <button
            onClick={() => toggleTab("projects")}
            style={{
              padding: "14px 18px",
              fontSize: "15px",
              fontWeight: "500",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "projects" ? "#059669" : "#f0f4f9",
              color: activeTab === "projects" ? "#ffffff" : "#374151",
              boxShadow: activeTab === "projects" ? "0 4px 12px rgba(5, 150, 105, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = activeTab === "projects" ? "0 12px 24px rgba(5, 150, 105, 0.4)" : "0 8px 16px rgba(0, 0, 0, 0.12)";
              if (activeTab !== "projects") {
                e.target.style.backgroundColor = "#e5ecf5";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              if (activeTab !== "projects") {
                e.target.style.backgroundColor = "#f0f4f9";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              } else {
                e.target.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.3)";
              }
            }}
          >
            🎯 Projects
          </button>
          <button
            onClick={() => toggleTab("workLogs")}
            style={{
              padding: "14px 18px",
              fontSize: "15px",
              fontWeight: "500",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "workLogs" ? "#d97706" : "#f0f4f9",
              color: activeTab === "workLogs" ? "#ffffff" : "#374151",
              boxShadow: activeTab === "workLogs" ? "0 4px 12px rgba(217, 119, 6, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = activeTab === "workLogs" ? "0 12px 24px rgba(217, 119, 6, 0.4)" : "0 8px 16px rgba(0, 0, 0, 0.12)";
              if (activeTab !== "workLogs") {
                e.target.style.backgroundColor = "#fef3c7";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              if (activeTab !== "workLogs") {
                e.target.style.backgroundColor = "#f0f4f9";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              } else {
                e.target.style.boxShadow = "0 4px 12px rgba(217, 119, 6, 0.3)";
              }
            }}
          >
            ⏱️ Work Logs
          </button>
          <button
            onClick={() => toggleTab("invoices")}
            style={{
              padding: "14px 18px",
              fontSize: "15px",
              fontWeight: "500",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "invoices" ? "#2563eb" : "#f0f4f9",
              color: activeTab === "invoices" ? "#ffffff" : "#374151",
              boxShadow: activeTab === "invoices" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = activeTab === "invoices" ? "0 12px 24px rgba(37, 99, 235, 0.4)" : "0 8px 16px rgba(0, 0, 0, 0.12)";
              if (activeTab !== "invoices") {
                e.target.style.backgroundColor = "#e5ecf5";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              if (activeTab !== "invoices") {
                e.target.style.backgroundColor = "#f0f4f9";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              } else {
                e.target.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
              }
            }}
          >
            📄 Invoices
          </button>
          <button
            onClick={() => toggleTab("expenses")}
            style={{
              padding: "14px 18px",
              fontSize: "15px",
              fontWeight: "500",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "expenses" ? "#dc2626" : "#f0f4f9",
              color: activeTab === "expenses" ? "#ffffff" : "#374151",
              boxShadow: activeTab === "expenses" ? "0 4px 12px rgba(220, 38, 38, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = activeTab === "expenses" ? "0 12px 24px rgba(220, 38, 38, 0.4)" : "0 8px 16px rgba(0, 0, 0, 0.12)";
              if (activeTab !== "expenses") {
                e.target.style.backgroundColor = "#fee2e2";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              if (activeTab !== "expenses") {
                e.target.style.backgroundColor = "#f0f4f9";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              } else {
                e.target.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
              }
            }}
          >
            💰 Expenses
          </button>
          <button
            onClick={() => toggleTab("payments")}
            style={{
              padding: "14px 18px",
              fontSize: "15px",
              fontWeight: "500",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "payments" ? "#7c3aed" : "#f0f4f9",
              color: activeTab === "payments" ? "#ffffff" : "#374151",
              boxShadow: activeTab === "payments" ? "0 4px 12px rgba(124, 58, 237, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.05)";
              e.target.style.boxShadow = activeTab === "payments" ? "0 12px 24px rgba(124, 58, 237, 0.4)" : "0 8px 16px rgba(0, 0, 0, 0.12)";
              if (activeTab !== "payments") {
                e.target.style.backgroundColor = "#ede9fe";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              if (activeTab !== "payments") {
                e.target.style.backgroundColor = "#f0f4f9";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              } else {
                e.target.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.3)";
              }
            }}
          >
            💳 Payments
          </button>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        {getTabContent()}
      </div>
    </div>
  );
};

export default ClientPortalPage;
