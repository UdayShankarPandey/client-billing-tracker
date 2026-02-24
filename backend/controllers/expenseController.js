const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const { category, description, amount, vendor, date, status, paymentMethod, receipt, notes, tags, taxDeductible, projectId } = req.body;

    // Validation
    if (!category || !description || !amount) {
      return res.status(400).json({ message: "Category, description, and amount are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const newExpense = new Expense({
      userId: req.userId,
      projectId: projectId || undefined,
      category,
      description,
      amount,
      vendor: vendor || null,
      date: date ? new Date(date) : new Date(),
      status: status || "pending",
      paymentMethod,
      receipt,
      notes,
      tags: tags || [],
      taxDeductible: taxDeductible || false,
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all expenses for user with filters
exports.getExpenses = async (req, res) => {
  try {
    const { category, status, projectId, startDate, endDate, sortBy = "-date" } = req.query;

    let filter = { userId: req.userId };

    // Apply filters
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }
    if (projectId) {
      filter.projectId = projectId;
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const expenses = await Expense.find(filter)
      .populate("projectId", "name")
      .sort(sortBy)
      .lean();

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("projectId");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { category, description, amount, vendor, date, status, paymentMethod, receipt, notes, tags, taxDeductible, projectId } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Update fields
    if (category) expense.category = category;
    if (description) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (vendor !== undefined) expense.vendor = vendor;
    if (date) expense.date = new Date(date);
    if (status) expense.status = status;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (receipt !== undefined) expense.receipt = receipt;
    if (notes !== undefined) expense.notes = notes;
    if (tags) expense.tags = tags;
    if (taxDeductible !== undefined) expense.taxDeductible = taxDeductible;
    if (projectId !== undefined) expense.projectId = projectId || null;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expense summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: new mongoose.Types.ObjectId(req.userId) };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date.$gte = new Date(startDate);
      }
      if (endDate) {
        match.date.$lte = new Date(endDate);
      }
    }

    const summary = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, "$amount", 0],
            },
          },
          taxDeductible: {
            $sum: {
              $cond: [{ $eq: ["$taxDeductible", true] }, "$amount", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalExpenses: 1,
          count: 1,
          approved: 1,
          pending: 1,
          paid: 1,
          rejected: 1,
          taxDeductible: 1,
        },
      },
    ]);

    res.json(summary[0] || {
      totalExpenses: 0,
      count: 0,
      approved: 0,
      pending: 0,
      paid: 0,
      rejected: 0,
      taxDeductible: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expenses by category
exports.getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: new mongoose.Types.ObjectId(req.userId) };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date.$gte = new Date(startDate);
      }
      if (endDate) {
        match.date.$lte = new Date(endDate);
      }
    }

    const byCategory = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(byCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expenses by month
exports.getExpensesByMonth = async (req, res) => {
  try {
    const byMonth = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    res.json(byMonth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk update expense status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { expenseIds, status } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ message: "Valid expenseIds array is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const objectIds = expenseIds.map((id) => new mongoose.Types.ObjectId(id));

    const result = await Expense.updateMany(
      { _id: { $in: objectIds }, userId: req.userId },
      { status }
    );

    res.json({
      message: `Updated ${result.modifiedCount} expenses`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
