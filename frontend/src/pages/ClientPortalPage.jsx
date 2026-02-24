import React, { useCallback, useEffect, useMemo, useState } from "react";
import { invoiceAPI } from "../services/api";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import DataTable from "../components/ui/DataTable";
import { useToast } from "../components/ui/Toast";
import "./ListPage.css";

const ClientPortalPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const fetchInvoices = useCallback(async () => {
    try {
      setError("");
      const response = await invoiceAPI.getAll();
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  const columns = useMemo(
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

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">Client Portal</h1>
      </div>
      <StateWrapper
        loading={loading}
        error={error}
        onRetry={fetchInvoices}
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
          <DataTable rows={invoices} columns={columns} emptyMessage="No invoices found" fileName="client-invoices.csv" />
        </div>
      </StateWrapper>
    </div>
  );
};

export default ClientPortalPage;
