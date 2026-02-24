const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { authMiddleware } = require("../middlewares/auth");

// All routes require authentication
router.use(authMiddleware);

// Create new expense
router.post("/", expenseController.createExpense);

// Get all expenses for user
router.get("/", expenseController.getExpenses);

// Get expense summary
router.get("/summary/all", expenseController.getExpenseSummary);

// Get expenses by category
router.get("/analytics/by-category", expenseController.getExpensesByCategory);

// Get expenses by month
router.get("/analytics/by-month", expenseController.getExpensesByMonth);

// Bulk update status
router.post("/bulk/update-status", expenseController.bulkUpdateStatus);

// Get single expense
router.get("/:id", expenseController.getExpenseById);

// Update expense
router.put("/:id", expenseController.updateExpense);

// Delete expense
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
