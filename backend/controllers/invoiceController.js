const PDFDocument = require("pdfkit");
const Invoice = require("../models/Invoice");
const WorkLog = require("../models/WorkLog");
const User = require("../models/User");
const {
  createInvoiceFromLogs,
  processPayment,
  updateClientOutstandingBalance,
  getInvoiceStatus,
} = require("../utils/billingService");

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => parseFloat(asNumber(value).toFixed(2));

// Create invoice from work logs
exports.createInvoice = async (req, res) => {
  try {
    const { clientId, projectId, workLogIds, taxPercentage, taxEnabled, notes, dueDate } = req.body;

    const invoice = await createInvoiceFromLogs(
      req.userId,
      clientId,
      projectId,
      workLogIds,
      taxPercentage || 0,
      !!taxEnabled
    );

    if (dueDate) {
      invoice.dueDate = new Date(dueDate);
      await invoice.save();
    }

    if (notes) {
      invoice.notes = notes;
      await invoice.save();
    }

    const populatedInvoice = await invoice.populate(["clientId", "projectId", "workLogIds"]);
    res.status(201).json({ message: "Invoice created successfully", invoice: populatedInvoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const { clientId, status, startDate, endDate } = req.query;

    const filter = req.userRole === "client"
      ? { clientId: req.clientId }
      : { userId: req.userId };
    if (clientId && req.userRole !== "client") filter.clientId = clientId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    let invoices = await Invoice.find(filter)
      .populate(req.userRole === "client" ? ["clientId"] : ["clientId", "projectId"])
      .sort({ issueDate: -1 });

    // Auto-update status for invoices that may have become overdue
    const now = new Date();
    for (const invoice of invoices) {
      const correctStatus = getInvoiceStatus(invoice);
      if (invoice.status !== correctStatus && correctStatus === "overdue") {
        // Only auto-update to overdue if not already paid
        await Invoice.findByIdAndUpdate(invoice._id, { status: "overdue" });
        invoice.status = "overdue";
      }
    }

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const query =
      req.userRole === "client"
        ? { _id: req.params.id, clientId: req.clientId }
        : { _id: req.params.id, userId: req.userId };

    const invoiceQuery = Invoice.findOne(query);
    if (req.userRole === "client") {
      invoiceQuery.select(
        "invoiceNumber status subtotal tax taxPercentage taxEnabled total amountPaid dueAmount issueDate dueDate paidDate notes clientId"
      );
      invoiceQuery.populate(["clientId"]);
    } else {
      invoiceQuery.populate(["clientId", "projectId", "workLogIds"]);
    }
    const invoice = await invoiceQuery;

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Auto-update status if it should be overdue
    const correctStatus = getInvoiceStatus(invoice);
    if (invoice.status !== correctStatus && correctStatus === "overdue") {
      await Invoice.findByIdAndUpdate(invoice._id, { status: "overdue" });
      invoice.status = "overdue";
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update invoice (status, notes, due date)
exports.updateInvoice = async (req, res) => {
  try {
    const { status, notes, dueDate, taxPercentage, taxEnabled } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (notes) invoice.notes = notes;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (typeof taxEnabled === "boolean" || typeof taxPercentage === "number") {
      const nextTaxEnabled = typeof taxEnabled === "boolean" ? taxEnabled : invoice.taxEnabled;
      const nextTaxPercentage = nextTaxEnabled ? asNumber(taxPercentage ?? invoice.taxPercentage) : 0;
      const nextTax = roundCurrency(asNumber(invoice.subtotal) * (nextTaxPercentage / 100));
      const nextTotal = roundCurrency(asNumber(invoice.subtotal) + nextTax);
      const nextDue = roundCurrency(Math.max(0, nextTotal - asNumber(invoice.amountPaid)));

      invoice.taxEnabled = nextTaxEnabled;
      invoice.taxPercentage = nextTaxPercentage;
      invoice.tax = nextTax;
      invoice.total = nextTotal;
      invoice.dueAmount = nextDue;
    }

    if (status) {
      // Validate status transition unless user is admin (admins can override)
      if (req.userRole !== "admin") {
        const validTransitions = {
          draft: ["sent", "draft"],
          sent: ["partially-paid", "paid", "overdue"],
          "partially-paid": ["paid", "overdue"],
          paid: [], // Terminal state for non-admins
          overdue: ["partially-paid", "paid"],
        };

        const allowedStatuses = validTransitions[invoice.status] || [invoice.status];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            message: `Cannot transition from ${invoice.status} to ${status}. Allowed transitions: ${allowedStatuses.join(
              ", "
            ) || "none (terminal state)"}`,
          });
        }
      }

      invoice.status = status;
      if (status === "paid") {
        const total = Number(invoice.total) || 0;
        invoice.amountPaid = total;
        invoice.dueAmount = 0;
        invoice.paidDate = new Date();
      }
    } else {
      // Auto-update status based on payment and due date if not manually set
      invoice.status = getInvoiceStatus(invoice);
    }

    await invoice.save();
    await updateClientOutstandingBalance(invoice.clientId);

    const updated = await invoice.populate(["clientId", "projectId", "workLogIds"]);
    res.json({ message: "Invoice updated successfully", invoice: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record payment on invoice
exports.recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const ownInvoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!ownInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = await processPayment(ownInvoice._id, normalizedAmount);

    const populatedInvoice = await invoice.populate(["clientId", "projectId"]);
    res.json({ message: "Payment recorded successfully", invoice: populatedInvoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete invoice
// ADMIN: Can delete any invoice status
// STAFF: Can only delete draft invoices
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // STAFF can only delete draft invoices
    if (req.userRole === "staff" && invoice.status !== "draft") {
      return res.status(403).json({ message: "You can only delete draft invoices. Contact admin to delete sent/paid invoices." });
    }

    // ADMIN can delete any invoice
    // (permission check is done by route middleware)

    // Unlink work logs
    await WorkLog.updateMany({ invoiceId: invoice._id }, { invoiceId: null });

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice statistics by client
exports.getInvoiceStats = async (req, res) => {
  try {
    const filter =
      req.userRole === "client"
        ? { clientId: req.clientId }
        : { userId: req.userId, clientId: req.params.clientId };
    const invoices = await Invoice.find(filter);

    const stats = {
      totalInvoiced: roundCurrency(invoices.reduce((sum, inv) => sum + asNumber(inv.total), 0)),
      totalPaid: roundCurrency(invoices.reduce((sum, inv) => sum + asNumber(inv.amountPaid), 0)),
      totalDue: roundCurrency(invoices.reduce((sum, inv) => sum + asNumber(inv.dueAmount), 0)),
      invoiceCount: invoices.length,
      paidCount: invoices.filter((inv) => inv.status === "paid").length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const drawMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const query =
      req.userRole === "client"
        ? { _id: req.params.id, clientId: req.clientId }
        : { _id: req.params.id, userId: req.userId };

    const invoice = await Invoice.findOne(query).populate(["clientId", "projectId", "workLogIds"]);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const user = req.userRole === "client"
      ? null
      : await User.findById(req.userId).select("name company email");
    const doc = new PDFDocument({ size: "A4", margin: 48, compress: false });
    const fileName = `${invoice.invoiceNumber}.pdf`;

    doc.info.Title = `Invoice ${invoice.invoiceNumber}`;
    doc.info.Author = user?.company || user?.name || "Billing Tracker";
    doc.info.CreationDate = new Date(invoice.issueDate);
    doc.info.ModDate = new Date(invoice.updatedAt || invoice.issueDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    doc.pipe(res);

    doc.fontSize(22).text(user?.company || "Billing Tracker", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#444").text(user?.email || "");
    doc.fillColor("#000");

    doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, { align: "right" });
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: "right" });
    doc.text(
      `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}`,
      { align: "right" }
    );

    doc.moveDown(1.2);
    doc.fontSize(12).text("Bill To");
    doc.fontSize(10).fillColor("#333");
    doc.text(invoice.clientId?.name || "-");
    doc.text(invoice.clientId?.company || "");
    doc.text(invoice.clientId?.email || "");
    if (invoice.clientId?.address) doc.text(invoice.clientId.address);
    doc.fillColor("#000");

    doc.moveDown(1.2);
    doc.fontSize(11).text("Line Items");
    doc.moveDown(0.3);

    const tableTop = doc.y;
    doc.fontSize(9).text("Date", 50, tableTop);
    doc.text("Description", 130, tableTop);
    doc.text("Hours", 390, tableTop, { width: 60, align: "right" });
    doc.text("Amount", 460, tableTop, { width: 90, align: "right" });
    doc.moveTo(50, tableTop + 14).lineTo(550, tableTop + 14).strokeColor("#cccccc").stroke();

    let y = tableTop + 22;
    for (const log of invoice.workLogIds || []) {
      if (y > 740) {
        doc.addPage();
        y = 60;
      }
      doc.fontSize(9).fillColor("#222");
      doc.text(new Date(log.date).toLocaleDateString(), 50, y);
      doc.text(log.description || "-", 130, y, { width: 250 });
      doc.text(`${Number(log.hours || 0).toFixed(2)}`, 390, y, { width: 60, align: "right" });
      doc.text(drawMoney(log.billableAmount), 460, y, { width: 90, align: "right" });
      y += 22;
    }

    y += 8;
    doc.moveTo(350, y).lineTo(550, y).strokeColor("#cccccc").stroke();
    y += 10;

    doc.fontSize(10).fillColor("#000");
    doc.text("Subtotal", 380, y, { width: 80 });
    doc.text(drawMoney(invoice.subtotal), 460, y, { width: 90, align: "right" });
    y += 18;

    doc.text(
      `Tax ${invoice.taxEnabled ? `(${Number(invoice.taxPercentage || 0).toFixed(2)}%)` : "(Disabled)"}`,
      380,
      y,
      { width: 80 }
    );
    doc.text(drawMoney(invoice.tax), 460, y, { width: 90, align: "right" });
    y += 18;

    doc.fontSize(12).text("Total", 380, y, { width: 80 });
    doc.text(drawMoney(invoice.total), 460, y, { width: 90, align: "right" });

    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text("Notes");
      doc.fontSize(9).fillColor("#333").text(invoice.notes);
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
