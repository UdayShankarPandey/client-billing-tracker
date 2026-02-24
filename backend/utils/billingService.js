const mongoose = require("mongoose");
const Project = require("../models/Project");
const WorkLog = require("../models/WorkLog");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Client = require("../models/Client");
const Expense = require("../models/Expense");

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => parseFloat(asNumber(value).toFixed(2));
const toCents = (value) => Math.round(roundCurrency(value) * 100);
const fromCents = (cents) => roundCurrency(cents / 100);

const getInvoiceFinancials = (invoice) => {
  const total = roundCurrency(asNumber(invoice?.total));
  const paidField = roundCurrency(asNumber(invoice?.amountPaid));
  const dueField = roundCurrency(asNumber(invoice?.dueAmount));

  const paidValid = paidField >= 0 && paidField <= total;
  const dueValid = dueField >= 0 && dueField <= total;
  const pairLooksConsistent =
    paidValid &&
    dueValid &&
    Math.abs(roundCurrency(total - (paidField + dueField))) <= 0.01;

  if (pairLooksConsistent) {
    return { total, paid: paidField, due: dueField };
  }

  // Prefer due when fields disagree; due usually reflects latest outstanding state.
  if (dueValid) {
    const paid = roundCurrency(Math.max(0, total - dueField));
    return { total, paid, due: roundCurrency(total - paid) };
  }

  if (paidValid) {
    const due = roundCurrency(Math.max(0, total - paidField));
    return { total, paid: roundCurrency(total - due), due };
  }

  return { total, paid: 0, due: total };
};

const getPaidValueFromInvoice = (invoice) => {
  return getInvoiceFinancials(invoice).paid;
};

const getDueValueFromInvoice = (invoice) => {
  return getInvoiceFinancials(invoice).due;
};

/**
 * Check if an invoice is overdue
 * @param {object} invoice - Invoice object
 * @returns {boolean} True if overdue (not fully paid and past due date)
 */
const isInvoiceOverdue = (invoice) => {
  if (!invoice || !invoice.dueDate) return false;
  
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const due = getDueValueFromInvoice(invoice);
  
  // Overdue if past due date AND still has outstanding balance
  return dueDate < now && due > 0;
};

const getInvoiceRevenuePaidDueCents = (invoice) => {
  const revenueCents = Math.max(0, toCents(invoice?.total));
  const rawPaidCents = Math.max(0, toCents(invoice?.amountPaid));
  const paidCents = Math.min(revenueCents, rawPaidCents);
  const dueCents = Math.max(0, revenueCents - paidCents);
  return { revenueCents, paidCents, dueCents };
};

const sumInvoiceSummaryCents = (invoices) =>
  invoices.reduce(
    (acc, invoice) => {
      const { revenueCents, paidCents, dueCents } = getInvoiceRevenuePaidDueCents(invoice);
      acc.revenueCents += revenueCents;
      acc.paidCents += paidCents;
      acc.dueCents += dueCents;
      return acc;
    },
    { revenueCents: 0, paidCents: 0, dueCents: 0 }
  );

/**
 * Calculate billable amount for a work log
 * @param {number} hours - Number of hours worked
 * @param {number} rate - Hourly rate
 * @returns {number} Billable amount
 */
const calculateBillableAmount = (hours, rate) => {
  return roundCurrency(asNumber(hours) * asNumber(rate));
};

/**
 * Calculate total earnings from a project
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Total earnings
 */
const calculateProjectEarnings = async (projectId) => {
  const workLogs = await WorkLog.find({ projectId, billable: true });
  const total = workLogs.reduce((sum, log) => sum + asNumber(log.billableAmount), 0);
  return roundCurrency(total);
};

/**
 * Calculate total hours logged on a project
 * @param {string} projectId - Project ID
 * @returns {Promise<number>} Total hours
 */
const calculateProjectHours = async (projectId) => {
  const workLogs = await WorkLog.find({ projectId });
  const total = workLogs.reduce((sum, log) => sum + asNumber(log.hours), 0);
  return roundCurrency(total);
};

/**
 * Generate invoice number
 * @returns {string} Unique invoice number
 */
const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne()
    .sort({ createdAt: -1 })
    .select("invoiceNumber");

  let number = 1001;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    number = parseInt(lastInvoice.invoiceNumber.replace("INV-", "")) + 1;
  }
  return `INV-${number}`;
};

/**
 * Create invoice from work logs
 * @param {string} userId - User ID
 * @param {string} clientId - Client ID
 * @param {string} projectId - Project ID
 * @param {array} workLogIds - Work log IDs
 * @param {number} taxPercentage - Tax percentage (default 0)
 * @returns {Promise<object>} Created invoice
 */
const createInvoiceFromLogs = async (
  userId,
  clientId,
  projectId,
  workLogIds,
  taxPercentage = 0,
  taxEnabled = false
) => {
  const workLogs = await WorkLog.find({
    _id: { $in: workLogIds },
    userId,
    billable: true,
    invoiceId: null,
  });

  if (workLogs.length === 0) {
    throw new Error("No billable work logs found");
  }

  const normalizedTaxPercentage = taxEnabled ? asNumber(taxPercentage) : 0;
  const subtotal = roundCurrency(workLogs.reduce((sum, log) => sum + asNumber(log.billableAmount), 0));
  const tax = roundCurrency(subtotal * (normalizedTaxPercentage / 100));
  const total = roundCurrency(subtotal + tax);

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    userId,
    clientId,
    projectId,
    invoiceNumber,
    workLogIds,
    subtotal,
    tax,
    taxPercentage: normalizedTaxPercentage,
    taxEnabled,
    total,
    dueAmount: total,
    status: "draft",
  });

  // Update work logs to link them to invoice
  await WorkLog.updateMany(
    { _id: { $in: workLogIds } },
    { invoiceId: invoice._id }
  );

  return invoice;
};

/**
 * Process payment and update invoice status
 * @param {string} invoiceId - Invoice ID
 * @param {number} amount - Payment amount
 * @returns {Promise<object>} Updated invoice
 */
const processPayment = async (invoiceId, amount) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const paymentAmount = asNumber(amount);
  const currentDue = getDueValueFromInvoice(invoice);
  if (paymentAmount > currentDue + 0.000001) {
    throw new Error("Payment amount exceeds invoice due amount");
  }

  const newAmountPaid = roundCurrency(getPaidValueFromInvoice(invoice) + paymentAmount);
  const dueAmount = roundCurrency(Math.max(0, asNumber(invoice.total) - newAmountPaid));
  
  // Update with new amounts
  invoice.amountPaid = newAmountPaid;
  invoice.dueAmount = dueAmount;
  
  // Determine status based on payment and due date
  const status = getInvoiceStatus(invoice);

  const updated = await Invoice.findByIdAndUpdate(
    invoiceId,
    {
      amountPaid: newAmountPaid,
      dueAmount,
      status,
      paidDate: status === "paid" ? new Date() : undefined,
    },
    { new: true }
  );

  // Update client outstanding balance
  await updateClientOutstandingBalance(invoice.clientId);

  return updated;
};

/**
 * Update invoice status based on payment and due date
 * @param {object} invoice - Invoice object
 * @returns {string} Updated status
 */
const getInvoiceStatus = (invoice) => {
  const due = getDueValueFromInvoice(invoice);
  const paid = getPaidValueFromInvoice(invoice);
  
  // If fully paid, always paid
  if (due <= 0.000001) return "paid";
  
  // If overdue, return overdue (unless fully paid)
  if (isInvoiceOverdue(invoice)) return "overdue";
  
  // If partially paid, return partially-paid
  if (paid > 0) return "partially-paid";
  
  // If no payment and not sent, return current status or sent
  return invoice.status === "draft" ? "draft" : "sent";
};

/**
 * Update client outstanding balance from all invoices
 * @param {string} clientId - Client ID
 */
const updateClientOutstandingBalance = async (clientId) => {
  const invoices = await Invoice.find({ clientId });
  const totalDue = roundCurrency(invoices.reduce((sum, inv) => sum + getDueValueFromInvoice(inv), 0));

  await Client.findByIdAndUpdate(clientId, { outstandingBalance: totalDue });
};

/**
 * Get monthly revenue summary
 * @param {string} userId - User ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<object>} Monthly revenue data
 */
const getMonthlyRevenue = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const invoices = await Invoice.find({
    userId,
    issueDate: { $gte: startDate, $lte: endDate },
  });
  const { revenueCents, paidCents, dueCents } = sumInvoiceSummaryCents(invoices);
  const invoiceCount = invoices.length;

  return {
    month,
    year,
    totalRevenue: fromCents(revenueCents),
    totalPaid: fromCents(paidCents),
    totalDue: fromCents(dueCents),
    invoiceCount,
  };
};

/**
 * Get profit per project
 * @param {string} projectId - Project ID
 * @returns {Promise<object>} Project profit data
 */
const getProjectProfit = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const earnings = await calculateProjectEarnings(projectId);
  const profit = earnings; // Simplified: profit = earnings (no expenses tracked yet)

  return {
    projectId,
    projectName: project.name,
    earnings: roundCurrency(earnings),
    profit: roundCurrency(profit),
  };
};

/**
 * Get dashboard summary for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Dashboard summary
 */
const getDashboardSummary = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const clients = await Client.find({ userId });
  const projects = await Project.find({ userId }).populate("clientId");
  const workLogs = await WorkLog.find({ userId });
  const invoices = await Invoice.find({ userId });
  const { revenueCents, paidCents, dueCents } = sumInvoiceSummaryCents(invoices);

  const monthlyRevenue = await getMonthlyRevenue(userId, currentMonth, currentYear);
  const totalHours = workLogs.reduce((sum, log) => sum + asNumber(log.hours), 0);

  return {
    clientCount: clients.length,
    projectCount: projects.length,
    totalHours: roundCurrency(totalHours),
    totalInvoiced: fromCents(revenueCents),
    totalPaid: fromCents(paidCents),
    totalOutstanding: fromCents(dueCents),
    monthlyRevenue,
  };
};

/**
 * Get revenue trend for last 12 months
 * @param {string} userId - User ID
 * @returns {Promise<array>} Monthly revenue trend data
 */
const getRevenueTrend = async (userId) => {
  const invoices = await Invoice.find({ userId });
  const monthlyData = {};

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { revenue: 0, paid: 0, due: 0 };
  }

  // Populate data from invoices
  invoices.forEach((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    const key = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData[key]) {
      const { total, paid, due } = getInvoiceFinancials(invoice);
      monthlyData[key].revenue += total;
      monthlyData[key].paid += paid;
      monthlyData[key].due += due;
    }
  });

  // Convert to array for charting
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    revenue: roundCurrency(data.revenue),
    paid: roundCurrency(data.paid),
    due: roundCurrency(data.due),
  }));
};

/**
 * Get invoice status breakdown
 * @param {string} userId - User ID
 * @returns {Promise<object>} Invoice status counts
 */
const getInvoiceStatusBreakdown = async (userId) => {
  const invoices = await Invoice.find({ userId });
  const breakdown = {
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
  };

  invoices.forEach((invoice) => {
    if (invoice.status === 'draft') {
      breakdown.draft++;
    } else if (invoice.status === 'overdue') {
      breakdown.overdue++;
    } else {
      const { paid, due } = getInvoiceFinancials(invoice);
      if (paid > 0 && due <= 0) {
        breakdown.paid++;
      } else if (paid > 0 && due > 0) {
        breakdown.pending++;
      } else if (paid === 0) {
        breakdown.pending++;
      }
    }
  });

  return breakdown;
};

/**
 * Get top clients by revenue
 * @param {string} userId - User ID
 * @param {number} limit - Number of top clients to return
 * @returns {Promise<array>} Top clients data
 */
const getTopClientsByRevenue = async (userId, limit = 5) => {
  const invoices = await Invoice.find({ userId }).populate('clientId');
  const clientRevenue = {};

  invoices.forEach((invoice) => {
    const clientName = invoice.clientId?.name || 'Unknown';
    const { total } = getInvoiceFinancials(invoice);
    
    if (!clientRevenue[clientName]) {
      clientRevenue[clientName] = 0;
    }
    clientRevenue[clientName] += total;
  });

  return Object.entries(clientRevenue)
    .map(([name, revenue]) => ({
      name,
      revenue: roundCurrency(revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

/**
 * Get project profitability
 * @param {string} userId - User ID
 * @param {number} limit - Number of projects to return
 * @returns {Promise<array>} Project profitability data
 */
const getProjectProfitability = async (userId, limit = 5) => {
  const projects = await Project.find({ userId });
  const projectData = [];

  for (const project of projects) {
    const earnings = await calculateProjectEarnings(project._id);
    projectData.push({
      name: project.name,
      profit: roundCurrency(earnings),
    });
  }

  return projectData
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
};

/**
 * Calculate total expenses for a user
 * @param {string} userId - User ID
 * @param {string} status - Optional status filter (pending, approved, rejected, paid)
 * @returns {Promise<number>} Total expenses
 */
const calculateTotalExpenses = async (userId, status = null) => {
  const match = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) {
    match.status = status;
  }
  
  const result = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result.length > 0 ? roundCurrency(result[0].total) : 0;
};

/**
 * Calculate total approved expenses
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total approved expenses
 */
const getApprovedExpenses = async (userId) => {
  return calculateTotalExpenses(userId, "approved");
};

/**
 * Calculate user profit (revenue - expenses)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Profit summary
 */
const calculateUserProfit = async (userId) => {
  const invoices = await Invoice.find({ userId });
  const { revenueCents } = sumInvoiceSummaryCents(invoices);
  const revenue = fromCents(revenueCents);
  
  const approvedExpenses = await getApprovedExpenses(userId);
  const profit = roundCurrency(revenue - approvedExpenses);

  return {
    revenue: roundCurrency(revenue),
    expenses: roundCurrency(approvedExpenses),
    profit,
    profitMargin: revenue > 0 ? roundCurrency((profit / revenue) * 100) : 0,
  };
};

/**
 * Get monthly expenses summary
 * @param {string} userId - User ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<object>} Monthly expenses data
 */
const getMonthlyExpenses = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ["approved", "paid"] },
  });

  const total = expenses.reduce((sum, exp) => sum + asNumber(exp.amount), 0);
  const approved = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, exp) => sum + asNumber(exp.amount), 0);
  const paid = expenses
    .filter((e) => e.status === "paid")
    .reduce((sum, exp) => sum + asNumber(exp.amount), 0);

  return {
    month,
    year,
    totalExpenses: roundCurrency(total),
    approvedExpenses: roundCurrency(approved),
    paidExpenses: roundCurrency(paid),
    expenseCount: expenses.length,
  };
};

/**
 * Get expenses trend for last 12 months
 * @param {string} userId - User ID
 * @returns {Promise<array>} Monthly expenses trend data
 */
const getExpensesTrend = async (userId) => {
  const expenses = await Expense.find({
    userId,
    status: { $in: ["approved", "paid"] },
  });

  const monthlyData = {};

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { expenses: 0, count: 0 };
  }

  // Populate data from expenses
  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    const key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[key]) {
      monthlyData[key].expenses += asNumber(expense.amount);
      monthlyData[key].count += 1;
    }
  });

  // Convert to array for charting
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    expenses: roundCurrency(data.expenses),
    count: data.count,
  }));
};

/**
 * Get expenses by category
 * @param {string} userId - User ID
 * @returns {Promise<array>} Expenses breakdown by category
 */
const getExpensesByCategory = async (userId) => {
  const expenses = await Expense.find({
    userId,
    status: { $in: ["approved", "paid"] },
  });

  const categoryData = {};

  expenses.forEach((expense) => {
    if (!categoryData[expense.category]) {
      categoryData[expense.category] = 0;
    }
    categoryData[expense.category] += asNumber(expense.amount);
  });

  return Object.entries(categoryData)
    .map(([category, amount]) => ({
      category,
      amount: roundCurrency(amount),
    }))
    .sort((a, b) => b.amount - a.amount);
};

/**
 * Get project profit with expenses
 * @param {string} projectId - Project ID
 * @returns {Promise<object>} Project profit data with expenses
 */
const getProjectProfitWithExpenses = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const earnings = await calculateProjectEarnings(projectId);
  
  const projectExpenses = await Expense.find({
    projectId,
    status: { $in: ["approved", "paid"] },
  });
  
  const expenses = roundCurrency(
    projectExpenses.reduce((sum, exp) => sum + asNumber(exp.amount), 0)
  );
  const profit = roundCurrency(earnings - expenses);
  const profitMargin = earnings > 0 ? roundCurrency((profit / earnings) * 100) : 0;

  return {
    projectId,
    projectName: project.name,
    earnings: roundCurrency(earnings),
    expenses,
    profit,
    profitMargin,
  };
};

module.exports = {
  calculateBillableAmount,
  calculateProjectEarnings,
  calculateProjectHours,
  generateInvoiceNumber,
  createInvoiceFromLogs,
  processPayment,
  updateClientOutstandingBalance,
  getMonthlyRevenue,
  getProjectProfit,
  getDashboardSummary,
  isInvoiceOverdue,
  getInvoiceStatus,
  getRevenueTrend,
  getInvoiceStatusBreakdown,
  getTopClientsByRevenue,
  getProjectProfitability,
  calculateTotalExpenses,
  getApprovedExpenses,
  calculateUserProfit,
  getMonthlyExpenses,
  getExpensesTrend,
  getExpensesByCategory,
  getProjectProfitWithExpenses,
};
