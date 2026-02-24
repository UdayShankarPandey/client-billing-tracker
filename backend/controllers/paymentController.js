const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const { updateClientOutstandingBalance, processPayment } = require("../utils/billingService");

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => parseFloat(asNumber(value).toFixed(2));

// Record payment
exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, clientId, amount, paymentMethod, transactionId, notes } = req.body;
    const normalizedAmount = roundCurrency(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const invoiceQuery = req.userRole === "client"
      ? { _id: invoiceId, clientId: req.clientId }
      : { _id: invoiceId };
    const invoice = await Invoice.findOne(invoiceQuery);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (String(invoice.clientId) !== String(clientId)) {
      return res.status(400).json({ message: "Payment client does not match invoice client" });
    }

    if (normalizedAmount > asNumber(invoice.dueAmount) + 0.000001) {
      return res.status(400).json({ message: "Payment amount exceeds invoice due amount" });
    }

    const payment = await Payment.create({
      userId: req.userId,
      invoiceId,
      clientId,
      amount: normalizedAmount,
      paymentMethod,
      transactionId,
      notes,
    });

    if (payment.status === "completed") {
      await processPayment(invoiceId, normalizedAmount);
    }

    const populatedPayment = await payment.populate(["invoiceId", "clientId"]);
    res.status(201).json({ message: "Payment recorded successfully", payment: populatedPayment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all payments
exports.getPayments = async (req, res) => {
  try {
    const { clientId, invoiceId, startDate, endDate, status } = req.query;

    const filter = req.userRole === "client" ? { clientId: req.clientId } : {};
    if (clientId) filter.clientId = clientId;
    if (invoiceId) filter.invoiceId = invoiceId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate(["invoiceId", "clientId"])
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single payment
exports.getPaymentById = async (req, res) => {
  try {
    const query =
      req.userRole === "client"
        ? { _id: req.params.id, clientId: req.clientId }
        : { _id: req.params.id };
    const payment = await Payment.findOne(query).populate(["invoiceId", "clientId"]);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payments by client
exports.getPaymentsByClient = async (req, res) => {
  try {
    const filter =
      req.userRole === "client"
        ? { clientId: req.clientId }
        : { clientId: req.params.clientId };
    const payments = await Payment.find(filter)
      .populate(["invoiceId", "clientId"])
      .sort({ paymentDate: -1 });

    const totalReceived = roundCurrency(payments.reduce((sum, p) => sum + asNumber(p.amount), 0));

    res.json({
      payments,
      summary: { totalReceived, paymentCount: payments.length },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const query = req.userRole === "client"
      ? { _id: req.params.id, clientId: req.clientId }
      : { _id: req.params.id };
    const existingPayment = await Payment.findOne(query);

    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    const wasCompleted = existingPayment.status === "completed";

    const payment = await Payment.findOneAndUpdate(
      query,
      { status, notes },
      { new: true }
    ).populate(["invoiceId", "clientId"]);

    if (!wasCompleted && payment.status === "completed") {
      await processPayment(payment.invoiceId?._id || payment.invoiceId, payment.amount);
    }

    // Update client balance if needed
    await updateClientOutstandingBalance(payment.clientId._id);

    res.json({ message: "Payment updated successfully", payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const query = req.userRole === "client"
      ? { _id: req.params.id, clientId: req.clientId }
      : { _id: req.params.id };
    const payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const clientId = payment.clientId;
    await Payment.findByIdAndDelete(req.params.id);

    // Recalculate client balance
    await updateClientOutstandingBalance(clientId);

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
