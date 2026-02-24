const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware } = require("../middlewares/auth");

router.use(authMiddleware);

router.get("/", dashboardController.getDashboard);
router.get("/revenue/monthly", dashboardController.getMonthlyRevenue);
router.get("/profit/:projectId", dashboardController.getProjectProfit);
router.get("/profit-with-expenses/:projectId", dashboardController.getProjectProfitWithExpenses);
router.get("/user/profit", dashboardController.getUserProfit);
router.get("/expenses/monthly", dashboardController.getMonthlyExpenses);
router.get("/charts/revenue-trend", dashboardController.getRevenueTrend);
router.get("/charts/expense-trend", dashboardController.getExpensesTrend);
router.get("/charts/invoice-status", dashboardController.getInvoiceStatusBreakdown);
router.get("/charts/expenses-by-category", dashboardController.getExpensesByCategory);
router.get("/charts/top-clients", dashboardController.getTopClientsByRevenue);
router.get("/charts/project-profitability", dashboardController.getProjectProfitability);

module.exports = router;
