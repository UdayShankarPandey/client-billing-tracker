const { getDashboardSummary, getMonthlyRevenue, getProjectProfit, getRevenueTrend, getInvoiceStatusBreakdown, getTopClientsByRevenue, getProjectProfitability, calculateUserProfit, getMonthlyExpenses, getExpensesTrend, getExpensesByCategory, getProjectProfitWithExpenses } = require("../utils/billingService");

// Get dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const summary = await getDashboardSummary(userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly revenue
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const userId = req.userRole === "client" ? req.userId : null;
    const revenue = await getMonthlyRevenue(userId, parseInt(month), parseInt(year));
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project profit
exports.getProjectProfit = async (req, res) => {
  try {
    const profit = await getProjectProfit(req.params.projectId);
    res.json(profit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get revenue trend for last 12 months
exports.getRevenueTrend = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const trend = await getRevenueTrend(userId);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice status breakdown
exports.getInvoiceStatusBreakdown = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const breakdown = await getInvoiceStatusBreakdown(userId);
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top clients by revenue
exports.getTopClientsByRevenue = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const userId = req.userRole === "client" ? req.userId : null;
    const clients = await getTopClientsByRevenue(userId, limit);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project profitability
exports.getProjectProfitability = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const userId = req.userRole === "client" ? req.userId : null;
    const projects = await getProjectProfitability(userId, limit);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profit (revenue - expenses)
exports.getUserProfit = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const profit = await calculateUserProfit(userId);
    res.json(profit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly expenses
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const userId = req.userRole === "client" ? req.userId : null;
    const expenses = await getMonthlyExpenses(userId, parseInt(month), parseInt(year));
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expenses trend for last 12 months
exports.getExpensesTrend = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const trend = await getExpensesTrend(userId);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expenses by category
exports.getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.userRole === "client" ? req.userId : null;
    const breakdown = await getExpensesByCategory(userId);
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project profit with expenses
exports.getProjectProfitWithExpenses = async (req, res) => {
  try {
    const profit = await getProjectProfitWithExpenses(req.params.projectId);
    res.json(profit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
