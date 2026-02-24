const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    category: {
      type: String,
      enum: [
        "software",
        "hardware",
        "labor",
        "utilities",
        "office-supplies",
        "travel",
        "marketing",
        "hosting",
        "subscription",
        "maintenance",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    vendor: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit-card", "bank-transfer", "check", "other"],
    },
    receipt: {
      type: String, // URL or file path
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    currency: {
      type: String,
      default: "USD",
    },
    taxDeductible: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, status: 1 });
expenseSchema.index({ projectId: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
